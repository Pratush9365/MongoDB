import type { UserDocument } from "../../model/user.model";
import { userRepo } from "../../Repository/user.repository";
import type { UserRepository } from "../../Repository/user.repository";
import type { IUserPayload } from "./user.interface";

export class UserService {
    public constructor(private readonly repository: UserRepository = userRepo) {}

    public createUser(payload: IUserPayload): Promise<UserDocument> {
        return this.repository.setUser(payload);
    }

    public getUsers() {
        return this.repository.getUser();
    }
}
