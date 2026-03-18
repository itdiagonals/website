package config

import (
	"os"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

var MidtransSnapClient *snap.Client

func InitMidtrans() {
	LoadEnv()

	client := &snap.Client{}
	client.New(os.Getenv("MIDTRANS_SERVER_KEY"), midtrans.Sandbox)

	MidtransSnapClient = client
}
