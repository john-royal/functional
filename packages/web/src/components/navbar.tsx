import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authSignOut } from "@/lib/server/auth";
import { useQuery, useZero } from "@functional/zero/react";
import { createId } from "@paralleldrive/cuid2";
import {
  Link,
  useNavigate,
  useParams,
  useRouteContext,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, LogOut, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function Navbar() {
  const { team } = useParams({ strict: false });
  const { subject } = useRouteContext({ from: "/_app" });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center justify-between gap-4 px-3">
        <p className="font-semibold text-orange-500">
          <Link
            to="/$team"
            params={{ team: team ?? subject.properties.defaultTeam.slug }}
          >
            Functional
          </Link>
        </p>
        {team && <TeamMenu slug={team} />}
        <UserMenu />
      </div>
    </header>
  );
}

function TeamMenu(props: { slug: string }) {
  const z = useZero();
  const [team] = useQuery(z.query.teams.where("slug", props.slug).one());
  const [teams] = useQuery(z.query.teams.orderBy("updatedAt", "desc"));
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-56 gap-1">
            <span className="w-full truncate text-sm text-muted-foreground text-left">
              {team?.name ?? "Team"}
            </span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team) => (
              <DropdownMenuItem key={team.id} asChild>
                <Link to="/$team" params={{ team: team.slug }}>
                  {team.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Plus />
            New Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewTeamMenu open={open} onOpenChange={setOpen} />
    </>
  );
}

function NewTeamMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const z = useZero();
  const navigate = useNavigate();
  const { subject } = useRouteContext({ from: "/_app" });
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const id = createId();
    const name = formData.get("name") as string;
    const slug = name.toLowerCase().replace(/ /g, "-");
    await z.mutateBatch(async (tx) => {
      await tx.teams.insert({
        id,
        name,
        slug,
        type: "organization",
      });
      await tx.teamMembers.insert({
        teamId: id,
        userId: subject.properties.id,
        role: "owner",
      });
    });
    navigate({ to: "/$team", params: { team: slug } });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" />
            </div>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserMenu() {
  const { subject } = useRouteContext({ from: "/_app" });
  const z = useZero();
  const [user] = useQuery(
    z.query.users.where("id", subject.properties.id).one()
  );
  const signOut = useServerFn(authSignOut);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="ml-auto">
          <AvatarImage src={user?.image} />
          <AvatarFallback>{user?.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
