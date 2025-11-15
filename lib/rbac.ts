// lib/rbac.ts
// Role-Based Access Control Configuration and Utilities

export type UserRole = "Admin" | "Health Center Workers" | "Inventory Staff 1"

export type PageName = "Dashboard" | "Inventory" | "Stocks" | "Reports" | "Prediction" | "UserManagement"

// Define which roles can access which pages
export const PAGE_PERMISSIONS: Record<PageName, UserRole[]> = {
    Dashboard: ["Admin", "Health Center Workers", "Inventory Staff 1"],
    Inventory: ["Admin", "Inventory Staff 1"],
    Stocks: ["Admin", "Health Center Workers", "Inventory Staff 1"],
    Reports: ["Admin"],
    Prediction: ["Admin", "Inventory Staff 1"],
    UserManagement: ["Admin"],
}

// Check if a role has access to a specific page
export function canAccessPage(userRole: string, pageName: PageName): boolean {
    const allowedRoles = PAGE_PERMISSIONS[pageName]
    return allowedRoles.includes(userRole as UserRole)
}

// Get user from localStorage
export function getCurrentUser() {
    if (typeof window === "undefined") return null

    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    try {
        return JSON.parse(userStr)
    } catch {
        return null
    }
}

// Check if current user can access a page
export function checkPageAccess(pageName: PageName): {
    hasAccess: boolean
    user: any
    message?: string
} {
    const user = getCurrentUser()

    if (!user) {
        return {
            hasAccess: false,
            user: null,
            message: "You must be logged in to access this page."
        }
    }

    const hasAccess = canAccessPage(user.role, pageName)

    if (!hasAccess) {
        const allowedRoles = PAGE_PERMISSIONS[pageName].join(", ")
        return {
            hasAccess: false,
            user,
            message: `Access denied. This page requires one of the following roles: ${allowedRoles}`
        }
    }

    return {
        hasAccess: true,
        user
    }
}

// React Hook for checking access (optional - for inline checks)
export function useAuth() {
    const user = getCurrentUser()

    return {
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === "Admin",
        isInventoryStaff: user?.role === "Inventory Staff 1",
        isHealthWorker: user?.role === "Health Center Workers",
        canAccess: (pageName: PageName) => {
            if (!user) return false
            return canAccessPage(user.role, pageName)
        }
    }
}
