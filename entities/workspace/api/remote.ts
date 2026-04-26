import { UserId } from '@/entities/user/model/types';
import { IListParams, IListResult } from '@/shared/api/types';
import { HTTPClient } from '@/shared/api/http';
import { IWorkspace, WorkspaceId, IWorkspaceUser } from '../model/types';
import { IWorkspaceApi } from './types';
import { getApiBase } from '@/shared/lib/api-base';

export default class WorkspaceRemoteAPI implements IWorkspaceApi {

    private _httpClient: HTTPClient = new HTTPClient();

    listWorkspaces(params?: IListParams): Promise<IListResult<IWorkspace>> {
        throw new Error('Method not implemented.');
    }
    createWorkspace(payload: { name: string; }): Promise<IWorkspace> {
        throw new Error('Method not implemented.');
    }
    getWorkspaceById(id: WorkspaceId): Promise<IWorkspace | null> {
        throw new Error('Method not implemented.');
    }
    async getActiveWorkspace(): Promise<IWorkspace | null> {
        const response = await this._httpClient.fetch('workspace/active');
    
        return response.json();
    }
    setActiveWorkspace(workspaceId: WorkspaceId): Promise<void> {
        throw new Error('Method not implemented.');
    }
    async listWorkspaceUsers(workspaceId: WorkspaceId): Promise<IWorkspaceUser[]> {
        const searchParams = new URLSearchParams({
            workspace_id: workspaceId.toString()
        });
        const response = await this._httpClient.fetch('workspace/users', {}, searchParams);
        const json = await response.json();

        return json.items.map((user: { id: number, name: string }) => ({
            id: user.id,
            name: user.name
        }))
    }
    addUserToWorkspace(payload: { workspaceId: WorkspaceId; userId: UserId; }): Promise<IWorkspaceUser> {
        throw new Error('Method not implemented.');
    }
    removeUserFromWorkspace(id: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    
}