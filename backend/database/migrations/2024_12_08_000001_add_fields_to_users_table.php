<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->enum('role', ['customer', 'admin'])->default('customer')->after('phone');
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending')->after('role');
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'role', 'status', 'address', 'city', 'state']);
        });
    }
};
