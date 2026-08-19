import React from 'react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
    currentRole: UserRole;
    onSwitchRole: (role: UserRole) => void;
}

const roles: UserRole[] = ['user', 'manager', 'support', 'accountant', 'admin', 'owner'];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onSwitchRole }) => {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 hidden sm:inline">Demo Rol:</span>
            <select
                value={currentRole}
                onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white focus:ring-orange-500 focus:border-orange-500"
            >
                {roles.map(role => (
                    <option key={role} value={role} className="capitalize">{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
            </select>
        </div>
    );
};
