package engine

import "testing"

func TestSpinValidationAndResult(t *testing.T) {
	if _, err := Spin(SpinRequest{Bet: 5}); err == nil {
		t.Fatal("expected error for bet below minimum 10")
	}
	if _, err := Spin(SpinRequest{Bet: 100000}); err == nil {
		t.Fatal("expected error for bet above maximum 99999")
	}

	res, err := Spin(SpinRequest{Bet: 100, ClientSeed: "testseed"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Bet != 100 || res.ClientSeed != "testseed" {
		t.Fatalf("unexpected bet/seed in response: %+v", res)
	}
	if len(res.Hash) != 64 {
		t.Fatalf("expected 64-char sha256 hex, got %d", len(res.Hash))
	}
	for i, reel := range res.Reels {
		if reel.ID == "" || reel.Glyph == "" {
			t.Fatalf("reel %d has empty symbol: %+v", i, reel)
		}
	}
}

func TestCalculateHarvest(t *testing.T) {
	starter := CalculateHarvest(HarvestRequest{
		StrainMult: 1.0,
		HP:         85,
		Streak:     3,
		LightMult:  1.0,
	})
	if starter.Biomass <= 0 || starter.THC <= 0 || starter.CupScore <= 0 {
		t.Fatalf("expected positive harvest metrics, got %+v", starter)
	}

	quantum := CalculateHarvest(HarvestRequest{
		StrainMult: 3.0,
		HP:         100,
		Streak:     30,
		LightMult:  1.6,
	})
	if quantum.Biomass <= starter.Biomass {
		t.Fatalf("expected quantum preset biomass (%d) > starter (%d)", quantum.Biomass, starter.Biomass)
	}
	if quantum.MutationChance > 35.0 {
		t.Fatalf("expected mutation chance capped at 35, got %v", quantum.MutationChance)
	}
}

func TestGetProtocolConfig(t *testing.T) {
	cfg := GetProtocolConfig()
	if len(cfg.SocialLinks) != 8 {
		t.Fatalf("expected 8 primary social highway links, got %d", len(cfg.SocialLinks))
	}
	if len(cfg.Wallets) != 4 {
		t.Fatalf("expected 4 crypto wallets, got %d", len(cfg.Wallets))
	}
}

func TestEvaluateReels(t *testing.T) {
	seven := Symbols[0]
	star := Symbols[1]
	dash := Symbols[5]

	if mult, out := evaluateReels([3]Symbol{seven, seven, seven}); mult != 10 || out != "jackpot" {
		t.Fatalf("expected 777 jackpot x10, got mult=%v outcome=%s", mult, out)
	}
	if mult, out := evaluateReels([3]Symbol{star, star, star}); mult != 7 || out != "win" {
		t.Fatalf("expected star x7 win, got mult=%v outcome=%s", mult, out)
	}
	if mult, out := evaluateReels([3]Symbol{seven, star, seven}); mult != PairMultiplier || out != "pair" {
		t.Fatalf("expected pair x1.5, got mult=%v outcome=%s", mult, out)
	}
	if mult, out := evaluateReels([3]Symbol{dash, dash, dash}); mult != 0 || out != "loss" {
		t.Fatalf("expected triple dash loss, got mult=%v outcome=%s", mult, out)
	}
	if mult, out := evaluateReels([3]Symbol{dash, star, dash}); mult != 0 || out != "loss" {
		t.Fatalf("expected pair of dashes to be loss, got mult=%v outcome=%s", mult, out)
	}
}
