package main

import (
	"context"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"bozheman-protocol/internal/engine"
	"bozheman-protocol/internal/sync"
)

func main() {
	port := envOr("PORT", "8080")
	staticDir := envOr("BZP_STATIC_DIR", ".")
	autoPull := strings.EqualFold(envOr("BZP_AUTO_PULL", "false"), "true")
	pullInterval := parseDurationOr(envOr("BZP_PULL_INTERVAL", "5m"), 5*time.Minute)
	syncSecret := os.Getenv("BZP_SYNC_SECRET")

	absDir, err := filepath.Abs(staticDir)
	if err != nil {
		absDir = staticDir
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	syncMgr := sync.NewManager(absDir, autoPull, pullInterval)
	syncMgr.StartLoop(ctx)

	mux := http.NewServeMux()

	// API v1 Routes
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"status":    "online",
			"protocol":  "BOZHEMAN ≡ PROTOCOL",
			"version":   "10.0-go-flutter",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"git":       syncMgr.GetStatus(),
		})
	})

	mux.HandleFunc("/api/v1/config", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		writeJSON(w, http.StatusOK, engine.GetProtocolConfig())
	})

	mux.HandleFunc("/api/v1/slots/spin", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		var req engine.SpinRequest
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json payload")
			return
		}
		res, err := engine.Spin(req)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, res)
	})

	mux.HandleFunc("/api/v1/lab/calc", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		var req engine.HarvestRequest
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json payload")
			return
		}
		writeJSON(w, http.StatusOK, engine.CalculateHarvest(req))
	})

	mux.HandleFunc("/api/v1/sync/status", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, syncMgr.GetStatus())
	})

	mux.HandleFunc("/api/v1/sync", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "use POST to trigger sync")
			return
		}
		if syncSecret != "" {
			token := r.Header.Get("X-Sync-Token")
			if token == "" {
				token = r.URL.Query().Get("token")
			}
			if token != syncSecret {
				writeError(w, http.StatusUnauthorized, "unauthorized sync token")
				return
			}
		}
		out, err := syncMgr.PullNow(r.Context())
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{
				"ok":     false,
				"error":  err.Error(),
				"output": out,
				"status": syncMgr.GetStatus(),
			})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":     true,
			"output": out,
			"status": syncMgr.GetStatus(),
		})
	})

	// Legacy .html route redirects to Flutter Web routes
	legacyRedirects := map[string]string{
		"/games.html":         "/#/games",
		"/roulet.html":        "/#/slots",
		"/refer.html":         "/#/support",
		"/doubleindex.html":   "/#/illusion",
		"/grower_manual.html": "/#/lab",
	}

	fileServer := http.FileServer(http.Dir(absDir))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		cleanPath := filepath.ToSlash(filepath.Clean(r.URL.Path))
		if target, ok := legacyRedirects[cleanPath]; ok {
			http.Redirect(w, r, target, http.StatusMovedPermanently)
			return
		}

		// Prevent exposing hidden/internal repo files (.git, go source, flutter source)
		if isBlockedPath(cleanPath) {
			http.NotFound(w, r)
			return
		}

		// Check if static file exists; otherwise serve Flutter index.html for SPA routes
		diskPath := filepath.Join(absDir, filepath.FromSlash(strings.TrimPrefix(cleanPath, "/")))
		if cleanPath == "/" {
			diskPath = filepath.Join(absDir, "index.html")
		}

		info, err := os.Stat(diskPath)
		if err == nil && !info.IsDir() {
			if strings.HasSuffix(cleanPath, ".json") || cleanPath == "/index.html" || cleanPath == "/" {
				w.Header().Set("Cache-Control", "no-cache")
			}
			fileServer.ServeHTTP(w, r)
			return
		}

		// Check if directory contains index.html
		if err == nil && info.IsDir() {
			idx := filepath.Join(diskPath, "index.html")
			if _, idxErr := os.Stat(idx); idxErr == nil {
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// SPA fallback for unknown non-asset routes
		if !strings.Contains(filepath.Base(cleanPath), ".") {
			http.ServeFile(w, r, filepath.Join(absDir, "index.html"))
			return
		}

		http.NotFound(w, r)
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           withCORS(mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("BOZHEMAN ≡ PROTOCOL Go Server listening on http://localhost:%s (static=%s)", port, absDir)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

func isBlockedPath(cleanPath string) bool {
	blockedPrefixes := []string{
		"/.git",
		"/.agents",
		"/.github",
		"/.specify",
		"/cmd",
		"/internal",
		"/flutter_app",
		"/go.mod",
		"/go.sum",
		"/bozheman-server",
	}
	for _, prefix := range blockedPrefixes {
		if cleanPath == prefix || strings.HasPrefix(cleanPath, prefix+"/") {
			return true
		}
	}
	if strings.HasSuffix(cleanPath, ".go") || strings.HasSuffix(cleanPath, ".exe") || strings.HasSuffix(cleanPath, ".ps1") || strings.HasSuffix(cleanPath, ".bat") || strings.HasSuffix(cleanPath, ".sh") {
		return true
	}
	_ = fs.ErrNotExist
	return false
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Sync-Token")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func envOr(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func parseDurationOr(raw string, fallback time.Duration) time.Duration {
	if d, err := time.ParseDuration(raw); err == nil && d > 0 {
		return d
	}
	return fallback
}
