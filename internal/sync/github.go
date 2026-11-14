package sync

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	gosync "sync"
	"sync/atomic"
	"time"
)

// Status describes the current state of the laptop-server GitHub synchronization.
type Status struct {
	AutoPullEnabled    bool   `json:"autoPullEnabled"`
	SelfRestartEnabled bool   `json:"selfRestartEnabled"`
	Restarting         bool   `json:"restarting,omitempty"`
	RepoDir            string `json:"repoDir"`
	GitBinary          string `json:"gitBinary"`
	GoBinary           string `json:"goBinary,omitempty"`
	Branch             string `json:"branch"`
	Commit             string `json:"commit"`
	LastSyncAt         string `json:"lastSyncAt,omitempty"`
	LastResult         string `json:"lastResult"`
	LastError          string `json:"lastError,omitempty"`
	Interval           string `json:"interval"`
}

// Manager runs periodic and on-demand GitHub sync + auto-rebuild + self-restart for the laptop host.
type Manager struct {
	mu                gosync.Mutex
	repoDir           string
	gitBin            string
	goBin             string
	autoPull          bool
	enableSelfRestart bool
	interval          time.Duration
	status            Status
	beforeRestart     func()
	restarting        atomic.Bool
}

// NewManager initializes the GitHub sync manager.
func NewManager(repoDir string, autoPull bool, interval time.Duration) *Manager {
	if interval <= 0 {
		interval = 20 * time.Second
	} else if interval < 10*time.Second {
		interval = 10 * time.Second
	}
	gitBin := findGitBinary()
	goBin := findGoBinary()
	m := &Manager{
		repoDir:           repoDir,
		gitBin:            gitBin,
		goBin:             goBin,
		autoPull:          autoPull,
		enableSelfRestart: autoPull,
		interval:          interval,
		status: Status{
			AutoPullEnabled:    autoPull,
			SelfRestartEnabled: autoPull,
			RepoDir:            repoDir,
			GitBinary:          gitBin,
			GoBinary:           goBin,
			Interval:           interval.String(),
			LastResult:         "initialized",
		},
	}
	m.refreshGitMeta()
	return m
}

// SetBeforeRestart registers a cleanup hook (e.g. closing the HTTP listener) before exec-restart.
func (m *Manager) SetBeforeRestart(fn func()) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.beforeRestart = fn
}

// SetSelfRestart toggles in-place binary rebuild + exec restart after pulling updates.
func (m *Manager) SetSelfRestart(enabled bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.enableSelfRestart = enabled
	m.status.SelfRestartEnabled = enabled
}

func findGitBinary() string {
	if p, err := exec.LookPath("git"); err == nil {
		return p
	}
	candidates := []string{
		`/usr/bin/git`,
		`/usr/local/bin/git`,
		`C:\Program Files\Git\cmd\git.exe`,
		`C:\Program Files\Git\bin\git.exe`,
		`C:\Program Files (x86)\Git\cmd\git.exe`,
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return ""
}

func findGoBinary() string {
	if p, err := exec.LookPath("go"); err == nil {
		return p
	}
	candidates := []string{
		`/usr/bin/go`,
		`/usr/local/go/bin/go`,
		`/snap/bin/go`,
		`C:\Program Files\Go\bin\go.exe`,
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return ""
}

// StartLoop launches the background auto-pull ticker if enabled.
func (m *Manager) StartLoop(ctx context.Context) {
	if !m.autoPull {
		return
	}
	if m.gitBin == "" {
		log.Printf("[sync] auto-pull enabled, but git binary not found")
		return
	}

	log.Printf("[sync] GitHub auto-pull active (interval=%s, self_restart=%v, dir=%s)",
		m.interval, m.enableSelfRestart, m.repoDir)

	go func() {
		timer := time.NewTimer(8 * time.Second)
		defer timer.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-timer.C:
				res, err := m.PullNow(ctx)
				if err != nil {
					log.Printf("[sync] pull warning: %v", err)
				} else if res != "" && !strings.Contains(strings.ToLower(res), "already up to date") {
					log.Printf("[sync] GitHub update synced: %s", res)
				}
				timer.Reset(m.interval)
			}
		}
	}()
}

// PullNow fetches origin/<branch>, compares SHAs, hard-resets when behind, and schedules self-restart if enabled.
func (m *Manager) PullNow(ctx context.Context) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.gitBin == "" {
		m.gitBin = findGitBinary()
		m.status.GitBinary = m.gitBin
	}
	if m.gitBin == "" {
		m.status.LastError = "git binary not found"
		m.status.LastSyncAt = time.Now().UTC().Format(time.RFC3339)
		return "", os.ErrNotExist
	}

	gitDir := filepath.Join(m.repoDir, ".git")
	if _, err := os.Stat(gitDir); err != nil {
		m.status.LastError = "not a git repository"
		m.status.LastSyncAt = time.Now().UTC().Format(time.RFC3339)
		return "", err
	}

	runCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	branch := "main"
	if bOut, err := m.runGit(runCtx, "rev-parse", "--abbrev-ref", "HEAD"); err == nil {
		b := strings.TrimSpace(bOut)
		if b != "" && b != "HEAD" {
			branch = b
		}
	}

	oldSHAOut, _ := m.runGit(runCtx, "rev-parse", "HEAD")
	oldSHA := strings.TrimSpace(oldSHAOut)

	if fetchOut, err := m.runGit(runCtx, "fetch", "origin", branch); err != nil {
		m.status.LastSyncAt = time.Now().UTC().Format(time.RFC3339)
		m.status.LastError = err.Error()
		m.status.LastResult = strings.TrimSpace(fetchOut)
		return fetchOut, err
	}

	remoteSHAOut, err := m.runGit(runCtx, "rev-parse", "origin/"+branch)
	if err != nil {
		m.status.LastSyncAt = time.Now().UTC().Format(time.RFC3339)
		m.status.LastError = err.Error()
		m.status.LastResult = strings.TrimSpace(remoteSHAOut)
		return remoteSHAOut, err
	}
	remoteSHA := strings.TrimSpace(remoteSHAOut)

	m.status.LastSyncAt = time.Now().UTC().Format(time.RFC3339)
	m.status.LastError = ""

	if oldSHA == remoteSHA && oldSHA != "" {
		m.status.LastResult = "Already up to date."
		m.refreshGitMetaLocked()
		return m.status.LastResult, nil
	}

	resetOut, err := m.runGit(runCtx, "reset", "--hard", "origin/"+branch)
	if err != nil {
		m.status.LastError = err.Error()
		m.status.LastResult = strings.TrimSpace(resetOut)
		return resetOut, err
	}

	shortOld := shortSHA(oldSHA)
	shortNew := shortSHA(remoteSHA)
	msg := fmt.Sprintf("Updated %s -> %s", shortOld, shortNew)
	m.status.LastResult = msg
	m.refreshGitMetaLocked()

	if m.enableSelfRestart && runtime.GOOS == "linux" && m.restarting.CompareAndSwap(false, true) {
		m.status.Restarting = true
		beforeHook := m.beforeRestart
		repoDir := m.repoDir
		goBin := m.goBin
		if goBin == "" {
			goBin = findGoBinary()
		}
		go func() {
			// Give HTTP handlers a brief moment to flush responses before rebuilding and replacing the process.
			time.Sleep(450 * time.Millisecond)
			rebuildAndRestart(repoDir, goBin, beforeHook)
		}()
	}

	return msg, nil
}

func rebuildAndRestart(repoDir, goBin string, beforeRestart func()) {
	targetBin := filepath.Join(repoDir, "bozheman-server")
	if exe, err := os.Executable(); err == nil && exe != "" {
		if absRepo, absErr := filepath.Abs(repoDir); absErr == nil && strings.HasPrefix(exe, absRepo) {
			targetBin = exe
		}
	}

	if goBin != "" {
		tmpBin := targetBin + ".new"
		log.Printf("[sync] building updated Go binary (%s)...", tmpBin)
		buildCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		cmd := exec.CommandContext(buildCtx, goBin, "build", "-o", tmpBin, "./cmd/server")
		cmd.Dir = repoDir
		var buf bytes.Buffer
		cmd.Stdout = &buf
		cmd.Stderr = &buf
		err := cmd.Run()
		cancel()
		if err != nil {
			log.Printf("[sync] go build failed (will restart via supervisor if needed): %v\n%s", err, buf.String())
			_ = os.Remove(tmpBin)
		} else {
			if err := os.Rename(tmpBin, targetBin); err != nil {
				log.Printf("[sync] rename new binary failed: %v", err)
			} else {
				log.Printf("[sync] Go binary rebuilt successfully.")
			}
		}
	}

	if beforeRestart != nil {
		beforeRestart()
	}

	args := os.Args
	if len(args) == 0 {
		args = []string{targetBin}
	}
	log.Printf("[sync] restarting server process in-place: %s", targetBin)
	if err := execReplace(targetBin, args, os.Environ()); err != nil {
		log.Printf("[sync] execReplace failed (%v), exiting cleanly for supervisor restart", err)
		os.Exit(0)
	}
}

func shortSHA(sha string) string {
	if len(sha) > 7 {
		return sha[:7]
	}
	if sha == "" {
		return "unknown"
	}
	return sha
}

// GetStatus returns a thread-safe snapshot of sync telemetry.
func (m *Manager) GetStatus() Status {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.refreshGitMetaLocked()
	return m.status
}

func (m *Manager) refreshGitMeta() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.refreshGitMetaLocked()
}

func (m *Manager) refreshGitMetaLocked() {
	if m.gitBin == "" {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if branch, err := m.runGit(ctx, "rev-parse", "--abbrev-ref", "HEAD"); err == nil {
		m.status.Branch = strings.TrimSpace(branch)
	}
	if commit, err := m.runGit(ctx, "rev-parse", "--short", "HEAD"); err == nil {
		m.status.Commit = strings.TrimSpace(commit)
	}
}

func (m *Manager) runGit(ctx context.Context, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, m.gitBin, args...)
	cmd.Dir = m.repoDir
	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf
	err := cmd.Run()
	return buf.String(), err
}
