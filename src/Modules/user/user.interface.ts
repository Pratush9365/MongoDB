/** The only shape of a user that is ever sent to a client: no password, no internals. */
export interface PublicUser {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUpdateProfilePayload {
    name: string;
}
