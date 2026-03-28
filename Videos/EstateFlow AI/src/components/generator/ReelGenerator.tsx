import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Upload, 
  Sparkles, 
  Play, 
  Download, 
  Plus, 
  X, 
  Home, 
  MapPin, 
  DollarSign, 
  Bed, 
  Bath, 
  Video,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Save,
  User,
  Globe,
  Copy,
  Instagram,
  Facebook,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { GoogleGenAI, Modality } from "@google/genai";
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { cn } from '../../lib/utils';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface PropertyData {
  price: string;
  location: string;
  beds: string;
  baths: string;
  description: string;
  agentName: string;
  agentPhone: string;
  agentPhoto?: string;
  logo?: string;
  voice: string;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

function createWavHeader(pcmData: Uint8Array, sampleRate: number = 24000) {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  // write the PCM data
  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return buffer;
}

export default function ReelGenerator() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    price: '',
    location: '',
    beds: '',
    baths: '',
    description: '',
    agentName: '',
    agentPhone: '',
    voice: 'Fenrir',
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [savedListingId, setSavedListingId] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 10
  } as any);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'agentPhoto' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateReel = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);
    
    try {
      // 1. Generate Script
      setGenerationProgress(30);
      const prompt = `Generate a high-energy, cinematic 20-second Instagram Reel script for a real estate listing. 
      Property Details:
      Price: ${propertyData.price}
      Location: ${propertyData.location}
      Beds: ${propertyData.beds}, Baths: ${propertyData.baths}
      Description: ${propertyData.description}
      Agent: ${propertyData.agentName}
      
      The script should be punchy, professional, and exciting. Include a clear call to action.
      Format the output as a single paragraph of text for voiceover.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const generatedScript = response.text || "Welcome to your dream home! This stunning property features incredible details and a prime location. Contact us today for a private tour.";
      setScript(generatedScript);

      // 2. Generate Voiceover
      setGenerationProgress(60);
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say enthusiastically: ${generatedScript}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: propertyData.voice }, 
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        // Wrap PCM in WAV header
        const wavBuffer = createWavHeader(bytes, 24000);
        const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      }

      setGenerationProgress(100);
      setTimeout(() => {
        setStep(3);
        setIsGenerating(false);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);

    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate reel. Please try again.");
      setIsGenerating(false);
    }
  };

  const saveReel = async () => {
    if (!script || !user?.id) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'listings'), {
        user_id: user.id,
        type: 'reel',
        input_data: propertyData,
        output_data: {
          script,
          audio_url: audioUrl
        },
        view_count: 0,
        created_at: serverTimestamp()
      });
      setSavedListingId(docRef.id);
      toast.success("Reel saved to your dashboard!");
    } catch (error) {
      console.error('Failed to save reel:', error);
      toast.error("Failed to save reel");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="flex items-center justify-center mb-12">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
              step >= i ? "border-orange-500 bg-orange-500 text-black" : "border-white/20 text-white/40"
            )}>
              {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
            </div>
            {i < 3 && (
              <div className={cn(
                "w-16 h-0.5 mx-2 transition-all duration-500",
                step > i ? "bg-orange-500" : "bg-white/10"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4 tracking-tight">Property Details</h1>
                <p className="text-white/60">Fill in the listing information to generate your cinematic script.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        name="price"
                        value={propertyData.price}
                        onChange={handleInputChange}
                        placeholder="e.g. $1,250,000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        name="location"
                        value={propertyData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. Beverly Hills, CA"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Bedrooms</label>
                    <div className="relative">
                      <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        name="beds"
                        value={propertyData.beds}
                        onChange={handleInputChange}
                        placeholder="e.g. 4"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Bathrooms</label>
                    <div className="relative">
                      <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        name="baths"
                        value={propertyData.baths}
                        onChange={handleInputChange}
                        placeholder="e.g. 3.5"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Description</label>
                  <textarea 
                    name="description"
                    value={propertyData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the key features, views, and vibe..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Agent Name</label>
                    <input 
                      name="agentName"
                      value={propertyData.agentName}
                      onChange={handleInputChange}
                      placeholder="Your Name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Phone</label>
                    <input 
                      name="agentPhone"
                      value={propertyData.agentPhone}
                      onChange={handleInputChange}
                      placeholder="(555) 000-0000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Agent Photo</label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'agentPhoto')}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 flex items-center gap-3 group-hover:border-white/20 transition-colors">
                        {propertyData.agentPhoto ? (
                          <img src={propertyData.agentPhoto} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-white/40" />
                        )}
                        <span className="text-sm text-white/40 truncate">
                          {propertyData.agentPhoto ? 'Photo Uploaded' : 'Upload Photo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Agency Logo</label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 flex items-center gap-3 group-hover:border-white/20 transition-colors">
                        {propertyData.logo ? (
                          <img src={propertyData.logo} className="w-6 h-6 object-contain" />
                        ) : (
                          <Building2 className="w-4 h-4 text-white/40" />
                        )}
                        <span className="text-sm text-white/40 truncate">
                          {propertyData.logo ? 'Logo Uploaded' : 'Upload Logo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Voiceover Style</label>
                  <div className="relative">
                    <select 
                      name="voice"
                      value={propertyData.voice}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500 transition-colors appearance-none text-white"
                    >
                      <option value="Fenrir" className="bg-zinc-900">Energetic Male (Fenrir)</option>
                      <option value="Puck" className="bg-zinc-900">Friendly Male (Puck)</option>
                      <option value="Charon" className="bg-zinc-900">Deep Professional Male (Charon)</option>
                      <option value="Kore" className="bg-zinc-900">Warm Female (Kore)</option>
                      <option value="Zephyr" className="bg-zinc-900">Professional Female (Zephyr)</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4 tracking-tight">Property Photos</h2>
                <p className="text-white/60">Upload up to 10 high-quality images of the property.</p>
              </div>

              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                  isDragActive ? "border-orange-500 bg-orange-500/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-orange-500" />
                </div>
                <p className="font-medium text-lg">Drag & drop photos</p>
                <p className="text-white/40 text-sm mt-1">or click to browse files</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img.preview} alt="Property" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <div 
                    {...getRootProps()}
                    className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!propertyData.price || images.length === 0}
                className="w-full bg-orange-500 text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-2xl mx-auto text-center space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">Ready to Generate?</h1>
              <p className="text-white/60 text-lg">We'll use AI to craft a cinematic script and professional voiceover for your property.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-left space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold">AI Script Generation</h3>
                  <p className="text-sm text-white/40">Optimized for social media engagement</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold">Pro Voiceover</h3>
                  <p className="text-sm text-white/40">Studio-quality AI narration</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold">Cinematic Transitions</h3>
                  <p className="text-sm text-white/40">Smooth motion and text overlays</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={generateReel}
                disabled={isGenerating}
                className="w-full bg-white text-black py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Reel... {generationProgress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                    Generate My Reel
                  </>
                )}
              </button>
              <button 
                onClick={() => setStep(1)}
                className="text-white/40 hover:text-white transition-colors text-sm font-medium"
              >
                Go back and edit details
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4 tracking-tight">Your Reel is Ready!</h1>
                <p className="text-white/60">Preview your cinematic property showcase below.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/40">AI Generated Script</label>
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-white/80 leading-relaxed italic">
                    "{script}"
                  </div>
                </div>

                {audioUrl && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Voiceover Preview</label>
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button className="bg-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                    <Download className="w-5 h-5" /> Download
                  </button>
                  <button 
                    onClick={saveReel}
                    disabled={isSaving}
                    className="bg-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save to Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setStep(1);
                      setImages([]);
                      setAudioUrl(null);
                      setScript('');
                      setSavedListingId(null);
                    }}
                    className="bg-orange-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-400 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Create New
                  </button>
                </div>

                {savedListingId && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-bold">Property Landing Page</h3>
                        <p className="text-xs text-white/40">Your property is live! Share this link to capture leads.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 pl-4">
                      <span className="text-xs text-white/40 truncate flex-1">
                        {window.location.origin}/property/{savedListingId}
                      </span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/property/${savedListingId}`);
                          toast.success("Link copied!");
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                        <Instagram className="w-5 h-5 text-white/40 group-hover:text-pink-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Instagram</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                        <Facebook className="w-5 h-5 text-white/40 group-hover:text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Facebook</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                        <Mail className="w-5 h-5 text-white/40 group-hover:text-orange-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Email</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <ReelPreview images={images} script={script} audioUrl={audioUrl} propertyData={propertyData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReelPreview({ images, script, audioUrl, propertyData }: { images: ImageFile[], script: string, audioUrl: string | null, propertyData: PropertyData }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-[320px] aspect-[9/16] bg-black rounded-[40px] border-[8px] border-white/10 overflow-hidden shadow-2xl shadow-orange-500/10">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-8 z-20">
        <span className="text-[10px] font-bold">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-white/20 rounded-full" />
          <div className="w-2 h-2 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Image Slider */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImageIndex}
          src={images[currentImageIndex]?.preview}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-block bg-orange-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Just Listed
          </div>
          
          <h2 className="text-3xl font-black leading-tight tracking-tighter uppercase italic">
            {propertyData.location.split(',')[0]}
          </h2>
          
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {propertyData.beds}</span>
            <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {propertyData.baths}</span>
            <span className="text-orange-500">{propertyData.price}</span>
          </div>

          <p className="text-[11px] text-white/70 line-clamp-3 leading-relaxed">
            {script}
          </p>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {propertyData.agentPhoto ? (
                <img src={propertyData.agentPhoto} className="w-10 h-10 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white/40" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Presented By</p>
                <p className="text-xs font-bold">{propertyData.agentName}</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden p-1">
              {propertyData.logo ? (
                <img src={propertyData.logo} className="w-full h-full object-contain" />
              ) : (
                <Home className="w-5 h-5" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <button 
          onClick={togglePlay}
          className={cn(
            "w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto",
            isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
          )}
        >
          {isPlaying ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}
    </div>
  );
}
