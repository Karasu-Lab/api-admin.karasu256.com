export class ContainerPortDto {
  IP!: string;
  PrivatePort!: number;
  PublicPort?: number;
  Type!: string;
}

export class ContainerInfoDto {
  id!: string;
  names!: string[];
  image!: string;
  imageId!: string;
  status!: string;
  state!: string;
  created!: number;
  ports!: ContainerPortDto[];
}
