package engine

// SocialLink defines a primary social/navigation node for Stream 1 (Social Highway).
type SocialLink struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	LabelKey string `json:"labelKey,omitempty"`
	Category string `json:"category"` // social | bot | hub | support | slots
	URL      string `json:"url"`
	Internal bool   `json:"internal"`
}

// CryptoWallet defines a supported cryptocurrency gateway.
type CryptoWallet struct {
	Symbol  string `json:"symbol"`
	Network string `json:"network"`
	Address string `json:"address"`
	Icon    string `json:"icon"`
}

// ReferralLink defines a partner link.
type ReferralLink struct {
	Name string `json:"name"`
	URL  string `json:"url"`
	Icon string `json:"icon"`
}

// ProjectCard defines an item in the Games Hub.
type ProjectCard struct {
	ID       string   `json:"id"`
	Code     string   `json:"code"`
	Category string   `json:"category"` // web | bot | dev
	TitleKey string   `json:"titleKey"`
	DescKey  string   `json:"descKey"`
	Status   string   `json:"status"`
	Tags     []string `json:"tags"`
	URL      string   `json:"url"`
	Internal bool     `json:"internal"`
}

// ProtocolConfig holds the full static/dynamic configuration served by Go backend.
type ProtocolConfig struct {
	Version       string         `json:"version"`
	SiteURL       string         `json:"siteUrl"`
	TelegramBot   string         `json:"telegramBot"`
	SteamTradeURL string         `json:"steamTradeUrl"`
	DMarketInvURL string         `json:"dmarketInvUrl"`
	SocialLinks   []SocialLink   `json:"socialLinks"`
	Wallets       []CryptoWallet `json:"wallets"`
	Referrals     []ReferralLink `json:"referrals"`
	Projects      []ProjectCard  `json:"projects"`
}

// GetProtocolConfig returns the canonical BOZHEMAN ≡ PROTOCOL configuration.
func GetProtocolConfig() ProtocolConfig {
	return ProtocolConfig{
		Version:       "10.0-go-flutter",
		SiteURL:       "https://bozheman.com",
		TelegramBot:   "https://t.me/GrowerSim_bot",
		SteamTradeURL: "https://steamcommunity.com/tradeoffer/new/?partner=158634293&token=U2y7ekdF",
		DMarketInvURL: "https://dmarket.com/ua/ingame-items/item-list/csgo-skins?sagaAddress=0x064Ca91243119Da8484b401984eC625554Ec9b30&exchangeTab=f2fOffers",
		SocialLinks: []SocialLink{
			{ID: "twitch", Label: "Twitch", Category: "social", URL: "https://www.twitch.tv/Bozhemany"},
			{ID: "youtube", Label: "YouTube", Category: "social", URL: "https://www.youtube.com/channel/UC_BgtvZc1dxQbJA1uEeFimw"},
			{ID: "instagram", Label: "Instagram", Category: "social", URL: "https://www.instagram.com/bozheman"},
			{ID: "tiktok", Label: "TikTok", Category: "social", URL: "https://www.tiktok.com/@bozheman_"},
			{ID: "growersim", Label: "TG @GrowerSim_bot", LabelKey: "nav_growersim", Category: "bot", URL: "https://t.me/GrowerSim_bot"},
			{ID: "donation", Label: "Donate", LabelKey: "nav_donation", Category: "support", URL: "https://donatello.to/bozheman"},
			{ID: "games", Label: "Games Hub", LabelKey: "nav_games", Category: "hub", URL: "/games", Internal: true},
			{ID: "support", Label: "Crypto & Partners", LabelKey: "partner_link", Category: "support", URL: "/support", Internal: true},
		},
		Wallets: []CryptoWallet{
			{Symbol: "USDT", Network: "TRC20", Address: "TF2MHpNpfaYkhVd855mMfTgusfxG8N7hZa", Icon: "assets/images/USDT.jpg"},
			{Symbol: "BTC", Network: "BITCOIN", Address: "125hh3cxk1PdgEcBf87H6jNdCfMCXK1vKH", Icon: "assets/images/BTC.jpg"},
			{Symbol: "ETH", Network: "ERC20", Address: "0xe1b3651e583a2eefd0f813a530cb55fda141eed2", Icon: "assets/images/ETH.jpg"},
			{Symbol: "BNB", Network: "BEP20", Address: "0xe1b3651e583a2eefd0f813a530cb55fda141eed2", Icon: "assets/images/BNB.jpg"},
		},
		Referrals: []ReferralLink{
			{Name: "DMarket", URL: "https://dmarket.com?ref=9Slq8aucc0", Icon: "assets/images/DM-LOGO.svg"},
			{Name: "CSGOEmpire", URL: "https://csgoempire.com/r/bozheman", Icon: "assets/images/CSGOEMPIRE-LOGO.svg"},
			{Name: "SWAP.GG", URL: "https://swap.gg/?r=uqOV9EAMXC", Icon: "assets/images/SWAPGG-LOGO.svg"},
		},
		Projects: []ProjectCard{
			{
				ID: "slots", Code: "#MOD-00", Category: "web",
				TitleKey: "game_slots_title", DescKey: "game_slots_desc", Status: "ONLINE",
				Tags: []string{"tag_canvas", "tag_webaudio", "tag_fair", "tag_jackpot"},
				URL: "/slots", Internal: true,
			},
			{
				ID: "growersim", Code: "#MOD-01", Category: "bot",
				TitleKey: "game_growersim_title", DescKey: "game_growersim_desc", Status: "ONLINE",
				Tags: []string{"tag_aiogram", "tag_genetics", "tag_p2p", "tag_cup"},
				URL: "https://t.me/GrowerSim_bot", Internal: false,
			},
			{
				ID: "terminus", Code: "#MOD-02", Category: "dev",
				TitleKey: "game_1_title", DescKey: "game_1_desc", Status: "IN DEV",
				Tags: []string{"tag_rpg", "tag_netrun", "tag_firebase"},
				URL: "/games", Internal: true,
			},
			{
				ID: "nebula", Code: "#MOD-03", Category: "dev",
				TitleKey: "game_3_title", DescKey: "game_3_desc", Status: "PROTOTYPE",
				Tags: []string{"tag_three", "tag_shaders", "tag_procedural"},
				URL: "/lab", Internal: true,
			},
		},
	}
}
