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
        Schema::create('savings_plan_durations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('savings_plan_id')->constrained()->onDelete('cascade');
            $table->integer('lock_period_days')->default(0);
            $table->decimal('interest_rate', 5, 2);
            $table->decimal('early_withdrawal_penalty', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('savings_plan_durations');
    }
};
