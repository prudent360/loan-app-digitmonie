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
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Customer\PaymentController;
use App\Http\Controllers\Customer\VirtualCardController;
use App\Http\Controllers\Customer\BillPaymentController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;

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

// Get loan settings (public)
Route::get('/loan-settings', [SettingsController::class, 'getLoanSettings']);

// Get logo (public)
Route::get('/logo', [SettingsController::class, 'getLogo']);

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

        // Payments
        Route::get('/payments/config', [PaymentController::class, 'getGatewayConfig']);
        Route::post('/payments/initialize', [PaymentController::class, 'initializePayment']);
        Route::post('/payments/verify', [PaymentController::class, 'verifyPayment']);
        Route::get('/payments/history', [PaymentController::class, 'getPaymentHistory']);

        // Virtual Cards
        Route::get('/cards', [VirtualCardController::class, 'index']);
        Route::post('/cards', [VirtualCardController::class, 'store']);
        Route::get('/cards/{id}', [VirtualCardController::class, 'show']);
        Route::post('/cards/{id}/fund', [VirtualCardController::class, 'fund']);
        Route::post('/cards/{id}/withdraw', [VirtualCardController::class, 'withdraw']);
        Route::post('/cards/{id}/block', [VirtualCardController::class, 'toggleBlock']);
        Route::delete('/cards/{id}', [VirtualCardController::class, 'terminate']);

        // Bill Payments
        Route::get('/bills/categories', [BillPaymentController::class, 'categories']);
        Route::get('/bills/billers', [BillPaymentController::class, 'billers']);
        Route::get('/bills/items', [BillPaymentController::class, 'items']);
        Route::post('/bills/validate', [BillPaymentController::class, 'validateCustomer']);
        Route::post('/bills/pay', [BillPaymentController::class, 'pay']);
        Route::get('/bills/history', [BillPaymentController::class, 'history']);
        Route::get('/bills/{id}', [BillPaymentController::class, 'show']);
    });

    // Admin routes - require any admin role
    Route::prefix('admin')->middleware('role:super_admin,loan_manager,kyc_officer,support')->group(function () {
        // Dashboard (view_reports permission)
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/dashboard/chart', [AdminDashboardController::class, 'chartData']);

        // Users - require manage_users permission
        Route::middleware('permission:manage_users')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);
        });

        // Roles - require assign_roles permission (super_admin only)
        Route::middleware('permission:assign_roles')->group(function () {
            Route::get('/roles', [RoleController::class, 'index']);
            Route::post('/roles', [RoleController::class, 'store']);
            Route::put('/roles/{role}', [RoleController::class, 'update']);
            Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
            Route::post('/users/{user}/roles', [RoleController::class, 'assignToUser']);
            Route::put('/users/{user}/roles', [RoleController::class, 'assignToUser']);
            Route::get('/staff', [RoleController::class, 'getStaffUsers']);
            Route::post('/staff', [RoleController::class, 'createStaff']);
        });

        // Loans - require manage_loans permission
        Route::middleware('permission:manage_loans')->group(function () {
            Route::get('/loans', [AdminLoanController::class, 'index']);
            Route::get('/loans/{loan}', [AdminLoanController::class, 'show']);
            Route::post('/loans/{loan}/approve', [AdminLoanController::class, 'approve']);
            Route::post('/loans/{loan}/reject', [AdminLoanController::class, 'reject']);
            Route::post('/loans/{loan}/disburse', [AdminLoanController::class, 'disburse']);
            Route::get('/loans/{loan}/repayments', [AdminPaymentController::class, 'getLoanRepayments']);
        });

        // Payments - require manage_loans permission
        Route::middleware('permission:manage_loans')->group(function () {
            Route::get('/payments', [AdminPaymentController::class, 'index']);
        });

        // KYC - require manage_kyc permission
        Route::middleware('permission:manage_kyc')->group(function () {
            Route::get('/kyc', [AdminKycController::class, 'index']);
            Route::post('/kyc/{document}/approve', [AdminKycController::class, 'approve']);
            Route::post('/kyc/{document}/reject', [AdminKycController::class, 'reject']);
        });

        // Settings - require manage_settings permission
        Route::middleware('permission:manage_settings')->group(function () {
            Route::get('/settings', [SettingsController::class, 'index']);
            Route::put('/settings', [SettingsController::class, 'update']);
            Route::post('/settings/logo', [SettingsController::class, 'uploadLogo']);
            Route::delete('/settings/logo', [SettingsController::class, 'deleteLogo']);
        });
    });
});
