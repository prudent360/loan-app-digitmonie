<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json([
            'currencies' => Setting::getValue('currencies', []),
            'loan_settings' => Setting::getValue('loan_settings', []),
            'notification_settings' => Setting::getValue('notification_settings', []),
        ]);
    }

    public function update(Request $request)
    {
        if ($request->has('currencies')) {
            Setting::setValue('currencies', $request->currencies);
        }

        if ($request->has('loan_settings')) {
            Setting::setValue('loan_settings', $request->loan_settings);
        }

        if ($request->has('notification_settings')) {
            Setting::setValue('notification_settings', $request->notification_settings);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    public function getActiveCurrency()
    {
        return response()->json(Setting::getActiveCurrency());
    }

    public function getLoanSettings()
    {
        $settings = Setting::getValue('loan_settings', [
            'min_amount' => 50000,
            'max_amount' => 5000000,
            'min_tenure' => 3,
            'max_tenure' => 36,
            'default_interest_rate' => 15,
        ]);
        
        return response()->json($settings);
    }
}
