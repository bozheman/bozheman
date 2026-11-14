package sync

import (
	"testing"
	"time"
)

func TestNewManagerAndStatus(t *testing.T) {
	mgr := NewManager("../..", false, 20*time.Second)
	st := mgr.GetStatus()
	if st.AutoPullEnabled {
		t.Fatal("expected AutoPullEnabled=false")
	}
	if st.Interval != (20 * time.Second).String() {
		t.Fatalf("unexpected interval %q", st.Interval)
	}
	if st.LastResult != "initialized" {
		t.Fatalf("expected initialized LastResult, got %q", st.LastResult)
	}
}
