// A custom error class for Firestore permission errors.
// This is used to provide more context to the user when a permission error occurs.
// It includes the path, operation, and the data that was being sent.
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    public context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;

        // This is to make the error message more readable in the console.
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
    
    toString() {
        return this.message;
    }
}
