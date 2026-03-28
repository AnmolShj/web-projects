import React, { useState } from 'react';
import { 
  Upload, 
  Sparkles, 
  Layout, 
  CheckCircle2, 
  Loader2, 
  X, 
  ChevronRight, 
  Plus, 
  Download,
  Image as ImageIcon,
  Palette,
  Maximize2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface StagingImage {
  id: string;
  file: File;
  preview: string;
  stagedPreview?: string;
  status: 'idle' | 'processing' | 'done';
}

const stagingStyles = [
  { id: 'modern', name: 'Modern', description: 'Sleek, clean lines and neutral tones', icon: Layout },
  { id: 'scandinavian', name: 'Scandinavian', description: 'Light wood, white accents, and cozy textures', icon: Palette },
  { id: 'industrial', name: 'Industrial', description: 'Exposed elements, metal, and dark wood', icon: Maximize2 },
  { id: 'traditional', name: 'Traditional', description: 'Classic furniture and warm, rich colors', icon: Layout },
];

export function VirtualStaging() {
  const { user } = useAuth();
  const [images, setImages] = useState<StagingImage[]>([]);
  const [selectedStyle, setSelectedStyle] = useState(stagingStyles[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);

  const onDrop = (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle' as const
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5
  } as any);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processStaging = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }

    setIsProcessing(true);
    
    const updatedImages = [...images];
    for (let i = 0; i < updatedImages.length; i++) {
      updatedImages[i].status = 'processing';
      setImages([...updatedImages]);
      
      try {
        const base64Data = await fileToBase64(updatedImages[i].file);
        const style = stagingStyles.find(s => s.id === selectedStyle);
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: updatedImages[i].file.type,
                },
              },
              {
                text: `Virtually stage this empty room with ${style?.name} style furniture. ${style?.description}. Make it look realistic and professional for a real estate listing.`,
              },
            ],
          },
        });

        let stagedUrl = '';
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            stagedUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (stagedUrl) {
          updatedImages[i].stagedPreview = stagedUrl;
          updatedImages[i].status = 'done';
        } else {
          throw new Error("No image returned from AI");
        }
      } catch (error) {
        console.error("Staging failed for image:", error);
        updatedImages[i].status = 'idle';
        toast.error(`Failed to stage image ${i + 1}`);
      }
      
      setImages([...updatedImages]);
    }

    setIsProcessing(false);
    setStep(2);
    toast.success("Virtual staging complete!");
  };

  const saveStaging = async () => {
    if (images.length === 0 || !user?.id) return;
    setIsSaving(true);
    try {
      const stagedImages = images.filter(img => img.status === 'done').map(img => ({
        original: img.preview,
        staged: img.stagedPreview,
        style: selectedStyle
      }));

      await addDoc(collection(db, 'listings'), {
        user_id: user.id,
        type: 'Virtual Staging',
        input_data: { style: selectedStyle },
        output_data: { images: stagedImages },
        created_at: serverTimestamp()
      });
      toast.success("Staging results saved to your dashboard!");
    } catch (error) {
      console.error('Failed to save staging:', error);
      toast.error("Failed to save staging results");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">AI Virtual Staging</h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Transform empty rooms into beautifully furnished spaces in seconds.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Upload Section */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">1. Upload Room Photos</h2>
                <p className="text-white/60">Upload high-quality photos of empty rooms for best results.</p>
              </div>

              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-[32px] p-16 flex flex-col items-center justify-center transition-all cursor-pointer",
                  isDragActive ? "border-orange-500 bg-orange-500/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <Upload className="w-10 h-10 text-orange-500" />
                </div>
                <p className="font-bold text-xl">Drag & drop room photos</p>
                <p className="text-white/40 mt-2">or click to browse files</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-video rounded-2xl overflow-hidden group border border-white/10">
                    <img src={img.preview} alt="Room" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    )}
                    {img.status === 'done' && (
                      <div className="absolute top-2 left-2 p-1 bg-green-500 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Style Section */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">2. Choose Staging Style</h2>
                <p className="text-white/60">Select the interior design style for your virtual furniture.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stagingStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "p-6 rounded-[32px] border text-left transition-all group",
                      selectedStyle === style.id 
                        ? "bg-orange-500 border-orange-500 text-black" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    <style.icon className={cn(
                      "w-8 h-8 mb-4 transition-transform group-hover:scale-110",
                      selectedStyle === style.id ? "text-black" : "text-orange-500"
                    )} />
                    <h3 className="font-bold text-lg mb-1">{style.name}</h3>
                    <p className={cn(
                      "text-sm",
                      selectedStyle === style.id ? "text-black/60" : "text-white/40"
                    )}>
                      {style.description}
                    </p>
                  </button>
                ))}
              </div>

              <button 
                onClick={processStaging}
                disabled={isProcessing || images.length === 0}
                className="w-full bg-white text-black py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Staging Rooms...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Stage {images.length} Room{images.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {images.map((img) => (
                <div key={img.id} className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden group">
                  <div className="grid grid-cols-2 aspect-video">
                    <div className="relative">
                      <img src={img.preview} alt="Original" className="w-full h-full object-cover" />
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Original
                      </div>
                    </div>
                    <div className="relative">
                      <img src={img.stagedPreview} alt="Staged" className="w-full h-full object-cover" />
                      <div className="absolute top-4 left-4 bg-orange-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-black">
                        Staged
                      </div>
                      <div className="absolute inset-0 bg-orange-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Room #{img.id}</h3>
                      <p className="text-sm text-white/40 capitalize">{selectedStyle} Style</p>
                    </div>
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all"
              >
                Stage More Rooms
              </button>
              <button 
                onClick={saveStaging}
                disabled={isSaving}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save to Dashboard
              </button>
              <button className="px-8 py-4 bg-orange-500 text-black rounded-2xl font-bold hover:bg-orange-400 transition-all flex items-center gap-2">
                <Download className="w-5 h-5" /> Download All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
