export type RoleName =
  | "Merlin"
  | "Percival"
  | "Morgana"
  | "Mordred"
  | "Oberon"
  | "Assassin"
  | "LoyalServant"
  | "Minion";

export type Alignment = "Good" | "Evil";

export interface RoleDefinition {
  readonly name: RoleName;
  readonly alignment: Alignment;
}

export interface RoleAssignment {
  readonly playerId: string;
  readonly role: RoleDefinition;
}
