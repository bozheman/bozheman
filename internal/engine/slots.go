package engine

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"math"
)

// Symbol describes a single slot reel symbol and its probability weight.
type Symbol struct {
	ID     string `json:"id"`
	Glyph  string `json:"glyph"`
	Color  string `json:"color"`
	Glow   string `json:"glow"`
	Weight int    `json:"weight"`
}

// Symbols mirrors the canonical BOZHEMAN 777 symbol pool.
var Symbols = []Symbol{
	{ID: "seven", Glyph: "7", Color: "#ff3333", Glow: "#ff0000", Weight: 4},
	{ID: "star", Glyph: "★", Color: "#ff4d4d", Glow: "#ff3333", Weight: 7},
	{ID: "omega", Glyph: "Ω", Color: "#cc0000", Glow: "#a30000", Weight: 9},
	{ID: "triangle", Glyph: "▲", Color: "#ff1a1a", Glow: "#e60000", Weight: 12},
	{ID: "square", Glyph: "■", Color: "#b30000", Glow: "#800000", Weight: 14},
	{ID: "dash", Glyph: "—", Color: "#660000", Glow: "#330000", Weight: 18},
}

// PayTable maps triple symbol IDs to their multipliers.
var PayTable = map[string]float64{
	"seven":    10,
	"star":     7,
	"omega":    5,
	"triangle": 3,
	"square":   2,
	"dash":     0,
}

const PairMultiplier = 1.5

var symbolPool []Symbol

func init() {
	for _, s := range Symbols {
		for i := 0; i < s.Weight; i++ {
			symbolPool = append(symbolPool, s)
		}
	}
}

// SpinRequest defines the input payload for /api/v1/slots/spin.
type SpinRequest struct {
	Bet        int    `json:"bet"`
	ClientSeed string `json:"clientSeed,omitempty"`
}

// SpinResult defines the Provably Fair result returned by the Go server.
type SpinResult struct {
	Reels      [3]Symbol `json:"reels"`
	Bet        int       `json:"bet"`
	Multiplier float64   `json:"multiplier"`
	Win        int       `json:"win"`
	Outcome    string    `json:"outcome"` // jackpot | win | pair | loss
	ServerSeed string    `json:"serverSeed"`
	ClientSeed string    `json:"clientSeed"`
	Hash       string    `json:"hash"`
	ShortHash  string    `json:"shortHash"`
}

// Spin executes a cryptographically secure, Provably Fair 3-reel spin.
// No real money is ever involved — virtual protocol credits only.
func Spin(req SpinRequest) (SpinResult, error) {
	if req.Bet < 10 {
		return SpinResult{}, fmt.Errorf("minimum bet is 10")
	}
	if req.Bet > 99999 {
		return SpinResult{}, fmt.Errorf("maximum bet is 99999")
	}

	clientSeed := req.ClientSeed
	if clientSeed == "" {
		clientSeed = randomHex(8)
	}
	serverSeed := randomHex(16)

	payload := fmt.Sprintf("%s:%s:%d", serverSeed, clientSeed, req.Bet)
	digest := sha256.Sum256([]byte(payload))
	hashHex := hex.EncodeToString(digest[:])

	var reels [3]Symbol
	poolLen := uint32(len(symbolPool))
	for i := 0; i < 3; i++ {
		// Deterministic derivation of each reel from distinct 4-byte slices of SHA-256
		offset := i * 4
		val := binary.BigEndian.Uint32(digest[offset : offset+4])
		reels[i] = symbolPool[val%poolLen]
	}

	mult, outcome := evaluateReels(reels)
	win := int(math.Round(float64(req.Bet) * mult))

	short := hashHex
	if len(short) > 12 {
		short = fmt.Sprintf("SHA256::%s...%s", short[:4], short[len(short)-4:])
	}

	return SpinResult{
		Reels:      reels,
		Bet:        req.Bet,
		Multiplier: mult,
		Win:        win,
		Outcome:    outcome,
		ServerSeed: serverSeed,
		ClientSeed: clientSeed,
		Hash:       hashHex,
		ShortHash:  short,
	}, nil
}

func evaluateReels(r [3]Symbol) (float64, string) {
	a, b, c := r[0].ID, r[1].ID, r[2].ID
	if a == b && b == c {
		mult := PayTable[a]
		if mult <= 0 {
			return 0, "loss"
		}
		if a == "seven" {
			return mult, "jackpot"
		}
		return mult, "win"
	}

	// Any two matching symbols (excluding dash) pay PairMultiplier
	if (a == b && a != "dash") || (b == c && b != "dash") || (a == c && a != "dash") {
		return PairMultiplier, "pair"
	}
	return 0, "loss"
}

func randomHex(nBytes int) string {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "00000000"
	}
	return hex.EncodeToString(b)
}
