export interface IUser{
  id?: string;
  index?: number;
}

export interface IUserProfileInput{
  name: string;
  initials: string;
  heightInCm: number;
  gender: string;
  dateOfBirth: string;
}

export interface IUserProfile extends IUser, IUserProfileInput {
  consentCode: number;
}
