import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";
import { transformationPhotosService } from "@/services/supabase";
import type { TransformationPhoto } from "@/services/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MemberProgressPhotosProps {
  memberId: string;
}

const MemberProgressPhotos = ({ memberId }: MemberProgressPhotosProps) => {
  const [photos, setPhotos] = useState<TransformationPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, [memberId]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const data = await transformationPhotosService.getByMemberId(memberId);
      setPhotos(data);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const weightChartData = photos
    .filter(p => p.weight)
    .map(p => ({
      date: new Date(p.photo_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      weight: p.weight,
    }));

  const weightChange = weightChartData.length >= 2 
    ? (weightChartData[weightChartData.length - 1].weight! - weightChartData[0].weight!).toFixed(1)
    : null;

  const firstPhoto = photos[0];
  const lastPhoto = photos[photos.length - 1];

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading progress photos...
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            My Progress Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No progress photos uploaded yet. Ask your trainer to add your transformation photos!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          My Progress Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compare" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compare">Before/After</TabsTrigger>
            <TabsTrigger value="gallery">All Photos</TabsTrigger>
            <TabsTrigger value="chart">Weight Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="compare">
            {photos.length >= 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden">
                      <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs font-medium text-foreground z-10">
                        BEFORE
                      </div>
                      <img 
                        src={firstPhoto.photo_url} 
                        alt="Before"
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {new Date(firstPhoto.photo_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                      {firstPhoto.weight && (
                        <p className="text-lg font-bold text-foreground">{firstPhoto.weight} kg</p>
                      )}
                    </div>
                  </div>

                  {/* After */}
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden">
                      <div className="absolute top-2 left-2 bg-primary/80 px-2 py-1 rounded text-xs font-medium text-primary-foreground z-10">
                        AFTER
                      </div>
                      <img 
                        src={lastPhoto.photo_url} 
                        alt="After"
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {new Date(lastPhoto.photo_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                      {lastPhoto.weight && (
                        <p className="text-lg font-bold text-foreground">{lastPhoto.weight} kg</p>
                      )}
                    </div>
                  </div>
                </div>

                {firstPhoto.weight && lastPhoto.weight && (
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center gap-4">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Progress:</span>
                    <span className={`text-xl font-bold flex items-center gap-1 ${
                      lastPhoto.weight < firstPhoto.weight ? "text-green-400" : "text-orange-400"
                    }`}>
                      {lastPhoto.weight < firstPhoto.weight ? (
                        <TrendingDown className="h-5 w-5" />
                      ) : (
                        <TrendingUp className="h-5 w-5" />
                      )}
                      {(lastPhoto.weight - firstPhoto.weight).toFixed(1)} kg
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Need at least 2 photos to show comparison.
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery">
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="space-y-1">
                  <img 
                    src={photo.photo_url} 
                    alt={`Progress ${photo.photo_date}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {new Date(photo.photo_date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chart">
            {weightChartData.length >= 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Start</p>
                    <p className="text-lg font-bold text-foreground">{weightChartData[0].weight} kg</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold text-foreground">
                      {weightChartData[weightChartData.length - 1].weight} kg
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Change</p>
                    <p className={`text-lg font-bold ${
                      parseFloat(weightChange!) < 0 ? "text-green-400" : "text-orange-400"
                    }`}>
                      {weightChange} kg
                    </p>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Need weight data from at least 2 photos to show chart.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MemberProgressPhotos;
