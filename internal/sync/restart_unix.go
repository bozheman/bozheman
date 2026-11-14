//go:build unix

package sync

import "syscall"

func execReplace(binaryPath string, args []string, env []string) error {
	return syscall.Exec(binaryPath, args, env)
}
