<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Setting;

class PaystackService
{
    protected $secretKey;
    protected $publicKey;
    protected $baseUrl = 'https://api.paystack.co';
    protected $mode;

    public function __construct()
    {
        $settings = Setting::getValue('payment_gateways', []);
        $this->mode = $settings['mode'] ?? 'test';
        
        $paystackSettings = $settings['paystack'] ?? [];
        
        // Use test or live keys based on mode
        if ($this->mode === 'live') {
            $this->secretKey = $paystackSettings['live_secret_key'] ?? '';
            $this->publicKey = $paystackSettings['live_public_key'] ?? '';
        } else {
            $this->secretKey = $paystackSettings['test_secret_key'] ?? '';
            $this->publicKey = $paystackSettings['test_public_key'] ?? '';
        }
    }

    public function getMode(): string
    {
        return $this->mode;
    }

    public function isLiveMode(): bool
    {
        return $this->mode === 'live';
    }

    public function initializeTransaction($email, $amount, $reference, $callbackUrl, $metadata = [])
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/transaction/initialize', [
            'email' => $email,
            'amount' => $amount * 100, // Paystack expects amount in kobo
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => $metadata,
        ]);

        return $response->json();
    }

    public function verifyTransaction($reference)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/transaction/verify/' . $reference);

        return $response->json();
    }

    public function getPublicKey()
    {
        return $this->publicKey;
    }

    public function isConfigured()
    {
        return !empty($this->secretKey) && !empty($this->publicKey);
    }
}
