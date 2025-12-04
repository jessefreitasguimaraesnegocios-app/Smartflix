import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { User, Upload, Image as ImageIcon } from 'lucide-react';

interface ProfileEditorProps {
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
  language: 'en' | 'pt';
}

const AVATAR_PRESETS = [
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png",
  "https://i.pinimg.com/originals/b6/77/cd/b677cd1cde292f261166533d6fe75872.png",
  "https://i.pinimg.com/originals/61/54/76/61547625e01d8daf941aae3ffb37f653.png",
  "https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSu99kXh_6d6m65Tj0_k_0tH8vC8h8f6b0fEw&s"
];

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ currentProfile, onSave, onCancel, language }) => {
  const [name, setName] = useState(currentProfile.name);
  const [avatar, setAvatar] = useState(currentProfile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    editProfile: language === 'pt' ? 'Editar Perfil' : 'Edit Profile',
    name: language === 'pt' ? 'Nome' : 'Name',
    chooseAvatar: language === 'pt' ? 'Escolha um ícone' : 'Choose an Icon',
    uploadTitle: language === 'pt' ? 'Sua Galeria' : 'Your Gallery',
    uploadBtn: language === 'pt' ? 'Carregar Foto' : 'Upload Photo',
    save: language === 'pt' ? 'Salvar' : 'Save',
    cancel: language === 'pt' ? 'Cancelar' : 'Cancel',
  };

  const handleSave = () => {
    onSave({ name, avatar });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pt-24 px-4 md:px-12 flex flex-col items-center min-h-screen text-white animate-fade-in">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-medium mb-8 border-b border-gray-700 pb-4">
          {t.editProfile}
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Current Avatar Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded overflow-hidden border-4 border-transparent hover:border-white transition relative group">
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <User className="w-8 h-8" />
                </div>
            </div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#333] text-white px-4 py-2 rounded border border-transparent focus:border-white outline-none text-center w-full"
              placeholder={t.name}
            />
          </div>

          {/* Right Column: Selection */}
          <div className="flex-1 space-y-8">
            {/* Presets */}
            <div>
              <h3 className="text-gray-400 mb-3 text-lg">{t.chooseAvatar}</h3>
              <div className="flex flex-wrap gap-4">
                {AVATAR_PRESETS.map((url, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setAvatar(url)}
                    className={`w-16 h-16 rounded overflow-hidden transition-all duration-200 ${avatar === url ? 'ring-4 ring-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div>
                 <h3 className="text-gray-400 mb-3 text-lg">{t.uploadTitle}</h3>
                 <div className="flex gap-4 items-center">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button 
                        onClick={triggerFileInput}
                        className="flex items-center gap-2 bg-[#333] border border-gray-600 px-6 py-3 rounded hover:bg-white hover:text-black hover:border-white transition duration-300 group"
                    >
                        <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{t.uploadBtn}</span>
                    </button>
                    <div className="text-gray-500 text-sm italic">
                        <ImageIcon className="inline w-4 h-4 mr-1" /> JPG, PNG
                    </div>
                 </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-gray-700">
          <button 
            onClick={handleSave}
            className="bg-white text-black px-8 py-2 font-bold text-lg hover:bg-red-600 hover:text-white transition duration-300"
          >
            {t.save}
          </button>
          <button 
            onClick={onCancel}
            className="border border-gray-500 text-gray-500 hover:border-white hover:text-white px-8 py-2 font-bold text-lg transition duration-300"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};