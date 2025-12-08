<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();
        
        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles',
            'display_name' => 'required|string',
            'description' => 'nullable|string',
            'permissions' => 'array',
        ]);

        $role = Role::create([
            'name' => strtolower(str_replace(' ', '_', $request->name)),
            'display_name' => $request->display_name,
            'description' => $request->description,
        ]);

        if ($request->permissions) {
            $permissionIds = Permission::whereIn('name', $request->permissions)->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role->load('permissions'),
        ], 201);
    }

    public function update(Request $request, Role $role)
    {
        // Prevent editing super_admin role
        if ($role->name === 'super_admin') {
            return response()->json(['message' => 'Cannot modify super admin role'], 403);
        }

        $request->validate([
            'display_name' => 'sometimes|string',
            'description' => 'nullable|string',
            'permissions' => 'array',
        ]);

        $role->update($request->only(['display_name', 'description']));

        if ($request->has('permissions')) {
            $permissionIds = Permission::whereIn('name', $request->permissions)->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role->load('permissions'),
        ]);
    }

    public function destroy(Role $role)
    {
        // Prevent deleting core roles
        if (in_array($role->name, ['super_admin', 'loan_manager', 'kyc_officer', 'support'])) {
            return response()->json(['message' => 'Cannot delete core roles'], 403);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    public function assignToUser(Request $request, User $user)
    {
        $request->validate([
            'roles' => 'required|array',
        ]);

        // Prevent self-demotion from super_admin
        if ($request->user()->id === $user->id && $user->hasRole('super_admin') && !in_array('super_admin', $request->roles)) {
            return response()->json(['message' => 'Cannot remove own super admin role'], 403);
        }

        $user->syncRoles($request->roles);

        return response()->json([
            'message' => 'Roles assigned successfully',
            'user' => $user->load('roles'),
        ]);
    }

    public function getStaffUsers()
    {
        $users = User::whereHas('roles')->with('roles')->get();
        
        return response()->json(['users' => $users]);
    }
}
