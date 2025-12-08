<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            ['name' => 'manage_users', 'display_name' => 'Manage Users', 'description' => 'Create, update, suspend users'],
            ['name' => 'assign_roles', 'display_name' => 'Assign Roles', 'description' => 'Assign roles to staff members'],
            ['name' => 'manage_loans', 'display_name' => 'Manage Loans', 'description' => 'Approve or reject loan applications'],
            ['name' => 'manage_kyc', 'display_name' => 'Manage KYC', 'description' => 'Verify or reject KYC documents'],
            ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Access dashboard and reports'],
            ['name' => 'manage_settings', 'display_name' => 'Manage Settings', 'description' => 'Update system settings'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // Create roles with permissions
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Full system access with all permissions',
                'permissions' => ['manage_users', 'assign_roles', 'manage_loans', 'manage_kyc', 'view_reports', 'manage_settings'],
            ],
            [
                'name' => 'loan_manager',
                'display_name' => 'Loan Manager',
                'description' => 'Can review and approve/reject loan applications',
                'permissions' => ['manage_loans', 'view_reports'],
            ],
            [
                'name' => 'kyc_officer',
                'display_name' => 'KYC Officer',
                'description' => 'Can review and verify KYC documents',
                'permissions' => ['manage_kyc', 'view_reports'],
            ],
            [
                'name' => 'support',
                'display_name' => 'Support Staff',
                'description' => 'Read-only access to view users and applications',
                'permissions' => ['view_reports'],
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                [
                    'display_name' => $roleData['display_name'],
                    'description' => $roleData['description'],
                ]
            );

            $permissionIds = Permission::whereIn('name', $roleData['permissions'])->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        // Create a default super admin user if none exists
        $superAdminRole = Role::where('name', 'super_admin')->first();
        
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@digitmonie.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'phone' => '+234 800 000 0000',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        if (!$adminUser->hasRole('super_admin')) {
            $adminUser->roles()->attach($superAdminRole);
        }

        $this->command->info('Roles and permissions seeded successfully!');
        $this->command->info('Default admin: admin@digitmonie.com / password123');
    }
}
