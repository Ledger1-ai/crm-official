import { Lock } from "lucide-react";

interface HeadingProps {
  title: string;
  description: string;
  visibility?: string;
}

const Heading = ({ title, description, visibility }: HeadingProps) => {
  return (
    <div className="">
      <h2 className="flex gap-2 text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
        {title}
        {visibility === "private" ? <Lock className="text-muted-foreground" /> : ""}
      </h2>
      <p className="text-muted-foreground mt-2 text-lg">{description}</p>
    </div>
  );
};

export default Heading;
