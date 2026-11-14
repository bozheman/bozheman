//go:build !unix

package sync

import "errors"

func execReplace(binaryPath string, args []string, env []string) error {
	return errors.New("in-place exec restart is only supported on unix hosts")
}
