<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Customer\LoanController as CustomerLoanController;
use App\Http\Controllers\Customer\KycController as CustomerKycController;
use App\Http\Controllers\Customer\DashboardController as CustomerDashboardController;
use App\Http\Controllers\Customer\ProfileController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\LoanController as AdminLoanController;
use App\Http\Controllers\Admin\KycController as AdminKycController;
use App\Http\Controllers\Admin\SettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Get active currency (public)
Route::get('/currency', [SettingsController::class, 'getActiveCurrency']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Customer routes
    Route::prefix('customer')->group(function () {
        // Dashboard
        Route::get('/dashboard/stats', [CustomerDashboardController::class, 'stats']);
        Route::get('/dashboard/chart', [CustomerDashboardController::class, 'chartData']);

        // Profile
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

        // Loans
        Route::get('/loans', [CustomerLoanController::class, 'index']);
        Route::post('/loans', [CustomerLoanController::class, 'store']);
        Route::get('/loans/{loan}', [CustomerLoanController::class, 'show']);
        Route::get('/loans/{loan}/repayments', [CustomerLoanController::class, 'repayments']);
        Route::post('/loans/{loan}/pay', [CustomerLoanController::class, 'recordPayment']);

        // KYC
        Route::get('/kyc', [CustomerKycController::class, 'index']);
        Route::post('/kyc', [CustomerKycController::class, 'store']);
        Route::delete('/kyc/{document}', [CustomerKycController::class, 'destroy']);
    });

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/dashboard/chart', [AdminDashboardController::class, 'chartData']);

        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);

        // Loans
        Route::get('/loans', [AdminLoanController::class, 'index']);
        Route::get('/loans/{loan}', [AdminLoanController::class, 'show']);
        Route::post('/loans/{loan}/approve', [AdminLoanController::class, 'approve']);
        Route::post('/loans/{loan}/reject', [AdminLoanController::class, 'reject']);
        Route::post('/loans/{loan}/disburse', [AdminLoanController::class, 'disburse']);

        // KYC
        Route::get('/kyc', [AdminKycController::class, 'index']);
        Route::post('/kyc/{document}/approve', [AdminKycController::class, 'approve']);
        Route::post('/kyc/{document}/reject', [AdminKycController::class, 'reject']);

        // Settings
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);
    });
});
