<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'json',
    ];

    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function setValue(string $key, $value): void
    {
        self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    public static function getActiveCurrency()
    {
        $currencies = self::getValue('currencies', []);
        return collect($currencies)->firstWhere('active', true) ?? [
            'code' => 'NGN',
            'symbol' => '₦',
            'name' => 'Nigerian Naira',
        ];
    }
}
