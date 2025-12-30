package natsclient

import (
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
)

type Config struct {
	URL       string `json:"url"`
	CredsPath string `json:"creds_path"`
}

type Client struct {
	nc *nats.Conn
}

func Connect(cfg Config) (*Client, error) {
	opts := []nats.Option{}
	if cfg.CredsPath != "" {
		opts = append(opts, nats.UserCredentials(cfg.CredsPath))
	}

	// Default URL if empty
	url := cfg.URL
	if url == "" {
		url = nats.DefaultURL
	}

	nc, err := nats.Connect(url, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	return &Client{nc: nc}, nil
}

func (c *Client) Close() {
	if c.nc != nil {
		c.nc.Close()
	}
}

func (c *Client) Request(subject string, data []byte, timeout time.Duration) ([]byte, error) {
	if c.nc == nil {
		return nil, fmt.Errorf("not connected")
	}

	msg, err := c.nc.Request(subject, data, timeout)
	if err != nil {
		return nil, err
	}

	return msg.Data, nil
}
