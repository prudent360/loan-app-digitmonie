<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->decimal('admin_fee', 15, 2)->default(0)->after('interest_rate');
            $table->boolean('admin_fee_paid')->default(false)->after('admin_fee');
            $table->unsignedBigInteger('admin_fee_payment_id')->nullable()->after('admin_fee_paid');
            
            $table->foreign('admin_fee_payment_id')
                  ->references('id')
                  ->on('payments')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropForeign(['admin_fee_payment_id']);
            $table->dropColumn(['admin_fee', 'admin_fee_paid', 'admin_fee_payment_id']);
        });
    }
};
