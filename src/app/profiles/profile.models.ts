export interface ProfileGroup {
  id: number;
  name: string;
  code: string;
  sort_order: number;
}

export interface Profile {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
  group: ProfileGroup;
}

export interface ProfileListResponse {
  data: Profile[];
}

export interface ProfileResponse {
  data: Profile;
}
