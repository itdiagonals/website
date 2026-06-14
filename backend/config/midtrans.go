package config

import (
	"os"
	"strings"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

var MidtransSnapClient *snap.Client

type MidtransConfig struct {
	ServerKey               string
	FinishURL               string
	OverrideNotificationURL string
	AppendNotificationURL   string
	IsProduction            bool
}

func GetMidtransConfig() MidtransConfig {
	LoadEnv()

	return MidtransConfig{
		ServerKey:               strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY")),
		FinishURL:               strings.TrimSpace(os.Getenv("MIDTRANS_FINISH_URL")),
		OverrideNotificationURL: strings.TrimSpace(os.Getenv("MIDTRANS_OVERRIDE_NOTIFICATION_URL")),
		AppendNotificationURL:   strings.TrimSpace(os.Getenv("MIDTRANS_APPEND_NOTIFICATION_URL")),
		IsProduction:            strings.EqualFold(strings.TrimSpace(os.Getenv("MIDTRANS_IS_PRODUCTION")), "true"),
	}
}

func InitMidtrans() {
	settings := GetMidtransConfig()

	env := midtrans.Sandbox
	if settings.IsProduction {
		env = midtrans.Production
	}

	client := &snap.Client{}
	client.New(settings.ServerKey, env)

	httpClient := midtrans.GetHttpClient(env)
	httpClient.Logger = &midtrans.LoggerImplementation{LogLevel: midtrans.NoLogging}

	if settings.OverrideNotificationURL != "" {
		midtrans.SetPaymentOverrideNotification(settings.OverrideNotificationURL)
	}

	if settings.AppendNotificationURL != "" {
		midtrans.SetPaymentAppendNotification(settings.AppendNotificationURL)
	}

	MidtransSnapClient = client
}
