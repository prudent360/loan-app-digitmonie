<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_savings', function (Blueprint $table) {
            $table->foreignId('savings_plan_duration_id')->nullable()->after('savings_plan_id')->constrained('savings_plan_durations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_savings', function (Blueprint $table) {
            $table->dropForeign(['savings_plan_duration_id']);
            $table->dropColumn('savings_plan_duration_id');
        });
    }
};
