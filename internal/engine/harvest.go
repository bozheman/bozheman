package engine

import "math"

// HarvestRequest defines inputs for the Mendel Genetics & Harvest Simulator.
type HarvestRequest struct {
	StrainMult float64 `json:"strainMult"`
	HP         int     `json:"hp"`
	Streak     int     `json:"streak"`
	LightMult  float64 `json:"lightMult"`
}

// HarvestResult defines calculated simulator metrics.
type HarvestResult struct {
	Biomass        int     `json:"biomass"`
	THC            float64 `json:"thc"`
	CupScore       int     `json:"cupScore"`
	BmanValue      int     `json:"bmanValue"`
	MutationChance float64 `json:"mutationChance"`
}

// CalculateHarvest computes Mendel harvest metrics matching the canonical protocol math.
func CalculateHarvest(req HarvestRequest) HarvestResult {
	strainMult := req.StrainMult
	if strainMult <= 0 {
		strainMult = 1.0
	}

	hp := req.HP
	if hp < 10 {
		hp = 10
	} else if hp > 100 {
		hp = 100
	}

	streak := req.Streak
	if streak < 0 {
		streak = 0
	} else if streak > 30 {
		streak = 30
	}

	lightMult := req.LightMult
	if lightMult <= 0 {
		lightMult = 1.0
	}

	const baseGrams = 85.0
	streakBonus := 1.0 + float64(streak)*0.045
	biomass := int(math.Round(baseGrams * strainMult * (float64(hp) / 100.0) * streakBonus * lightMult))

	thcRaw := 16.5*math.Pow(strainMult, 0.35)*(0.7+0.3*(float64(hp)/100.0)) + float64(streak)*0.25
	thc := math.Round(thcRaw*10) / 10

	cupScore := int(math.Round(float64(biomass)*3.2 + thcRaw*14.0 + float64(streak)*18.0))

	strainBonus := strainMult * 65.0
	if strainMult >= 3.0 {
		strainBonus = 350.0
	}
	bmanValue := int(math.Round(float64(biomass)*1.85 + strainBonus + float64(streak)*12.0))

	lightBonus := 1.0
	if lightMult > 1.3 {
		lightBonus = 4.5
	}
	mutRaw := math.Min(35.0, 5.0+float64(streak)*0.65+lightBonus)
	mutChance := math.Round(mutRaw*10) / 10

	return HarvestResult{
		Biomass:        biomass,
		THC:            thc,
		CupScore:       cupScore,
		BmanValue:      bmanValue,
		MutationChance: mutChance,
	}
}
