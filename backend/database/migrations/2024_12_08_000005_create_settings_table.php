<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            [
                'key' => 'currencies',
                'value' => json_encode([
                    ['code' => 'NGN', 'symbol' => '₦', 'name' => 'Nigerian Naira', 'active' => true],
                    ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar', 'active' => false],
                    ['code' => 'GBP', 'symbol' => '£', 'name' => 'British Pound', 'active' => false],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'loan_settings',
                'value' => json_encode([
                    'min_amount' => 50000,
                    'max_amount' => 5000000,
                    'min_tenure' => 3,
                    'max_tenure' => 36,
                    'default_interest_rate' => 15,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'notification_settings',
                'value' => json_encode([
                    'reminder_days_before' => 3,
                    'overdue_notification' => true,
                    'approval_notification' => true,
                    'disbursement_notification' => true,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
