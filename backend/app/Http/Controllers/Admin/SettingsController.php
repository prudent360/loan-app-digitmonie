<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json([
            'currencies' => Setting::getValue('currencies', []),
            'loan_settings' => Setting::getValue('loan_settings', []),
            'notification_settings' => Setting::getValue('notification_settings', []),
            'payment_gateways' => Setting::getValue('payment_gateways', [
                'active_gateway' => 'paystack',
                'paystack' => ['public_key' => '', 'secret_key' => '', 'enabled' => true],
                'flutterwave' => ['public_key' => '', 'secret_key' => '', 'enabled' => false],
            ]),
            'logo_url' => Setting::getValue('logo_url', null),
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

        if ($request->has('payment_gateways')) {
            Setting::setValue('payment_gateways', $request->payment_gateways);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Delete old logo if exists
        $oldLogo = Setting::getValue('logo_url', null);
        if ($oldLogo) {
            $oldPath = str_replace('/storage/', '', $oldLogo);
            Storage::disk('public')->delete($oldPath);
        }

        // Store new logo
        $path = $request->file('logo')->store('logos', 'public');
        $url = '/storage/' . $path;

        Setting::setValue('logo_url', $url);

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_url' => $url,
        ]);
    }

    public function deleteLogo()
    {
        try {
            $logo = Setting::getValue('logo_url', null);
            if ($logo) {
                $path = str_replace('/storage/', '', $logo);
                Storage::disk('public')->delete($path);
                // Delete the setting record instead of setting null
                Setting::where('key', 'logo_url')->delete();
            }

            return response()->json([
                'message' => 'Logo removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete logo: ' . $e->getMessage(),
            ], 500);
        }
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
            'admin_fee' => 2,
        ]);
        
        return response()->json($settings);
    }

    public function getLogo()
    {
        $logoUrl = Setting::getValue('logo_url', null);
        return response()->json([
            'logo_url' => $logoUrl,
        ]);
    }
}
