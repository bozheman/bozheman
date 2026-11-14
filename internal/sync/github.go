package sync

import (
	"bytes"
	"context"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	gosync "sync"
	"time"
)

// Status describes the current state of the laptop-server GitHub synchronization.
type Status struct {
	AutoPullEnabled bool   `json:"autoPullEnabled"`
	RepoDir         string `json:"repoDir"`
	GitBinary       string `json:"gitBinary"`
	Branch          string `json:"branch"`
	Commit          string `json:"commit"`
	LastSyncAt      string `json:"lastSyncAt,omitempty"`
	LastResult      string `json:"lastResult"`
	LastError       string `json:"lastError,omitempty"`
	Interval        string `json:"interval"`
}

// Manager runs periodic and on-demand git pull --ff-only for the laptop host.
type Manager struct {
	mu       gosync.Mutex
	repoDir  string
	gitBin   string
	autoPull bool
	interval time.Duration
	status   Status
}

// NewManager initializes the GitHub sync manager.
func NewManager(repoDir string, autoPull bool, interval time.Duration) *Manager {
	if interval < 30*time.Second {
		interval = 5 * time.Minute
	}
	gitBin := findGitBinary()
	m := &Manager{
		repoDir:  repoDir,
		gitBin:   gitBin,
		autoPull: autoPull,
		interval: interval,
		status: Status{
			AutoPullEnabled: autoPull,
			RepoDir:         repoDir,
			GitBinary:       gitBin,
			Interval:        interval.String(),
			LastResult:      "initialized",
		},
	}
	m.refreshGitMeta()
	return m
}

func findGitBinary() string {
	if p, err := exec.LookPath("git"); err == nil {
		return p
	}
	candidates := []string{
		`C:\Program Files\Git\cmd\git.exe`,
		`C:\Program Files\Git\bin\git.exe`,
		`C:\Program Files (x86)\Git\cmd\git.exe`,
		`/usr/bin/git`,
		`/usr/local/bin/git`,
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

	log.Printf("[sync] GitHub auto-pull active (interval=%s, dir=%s)", m.interval, m.repoDir)

	go func() {
		// Initial check shortly after startup
		timer := time.NewTimer(5 * time.Second)
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
					log.Printf("[sync] updated from GitHub: %s", res)
				}
				timer.Reset(m.interval)
			}
		}
	}()
}

// PullNow executes git fetch + git pull --ff-only safely.
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

	runCtx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()

	out, err := m.runGit(runCtx, "pull", "--ff-only")
	m.status.LastSyncAt = time.Now().UTC().Format(time.RFC3339)
	if err != nil {
		m.status.LastError = err.Error()
		m.status.LastResult = strings.TrimSpace(out)
		return out, err
	}

	m.status.LastError = ""
	m.status.LastResult = strings.TrimSpace(out)
	if m.status.LastResult == "" {
		m.status.LastResult = "Already up to date."
	}
	m.refreshGitMetaLocked()
	return m.status.LastResult, nil
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
