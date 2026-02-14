
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GptCard = async () => {
  return (
    <Card className="min-w-[350px]  max-w-[450px]">
      <CardHeader className="text-lg">
        <CardTitle>AI Assistant Config</CardTitle>
        <div className="text-xs text-muted-foreground">
          Feature is being upgraded.
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* <SetGptModel models={gptModels} /> */}
      </CardContent>
    </Card>
  );
};

export default GptCard;
