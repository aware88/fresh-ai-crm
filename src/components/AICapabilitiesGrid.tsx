import { motion } from 'framer-motion';

const capabilities = [
  {
    title: "Mind-Reading Psychology Engine",
    description: "Instantly analyzes communication patterns to build detailed psychological profiles. Discovers their DISC type, decision-making triggers, and emotional hot buttons in seconds. Know exactly how they think before you even reply.",
    icon: "🧠",
    result: "+347% response rates",
    feature: "Tony Robbins DISC + AI"
  },
  {
    title: "Persuasion AI Assistant", 
    description: "Leverages Cialdini's 6 Weapons of Influence + neuroscience triggers to craft messages that bypass logical resistance and speak directly to the subconscious. Every word chosen for maximum psychological impact.",
    icon: "⚡",
    result: "+89% close rates",
    feature: "Cialdini Influence Engine"
  },
  {
    title: "Emotional Trigger Detector",
    description: "Uses advanced behavioral analysis to identify fear, desire, urgency, and social proof triggers unique to each prospect. Automatically suggests the exact emotional buttons to press for instant engagement.",
    icon: "🎯",
    result: "+234% engagement",
    feature: "Emotion AI Technology"
  },
  {
    title: "Personality-Based Messaging",
    description: "Automatically adapts your communication style to match their personality type. Speaks to Drivers differently than Influencers. Treats Steady personalities with patience, Conscientious types with detail.",
    icon: "🤝",
    result: "+156% conversions",
    feature: "MBTI + Big Five Integration"
  },
  {
    title: "Subconscious Sales Scripts",
    description: "Generates messages using NLP patterns, embedded commands, and psychological frameworks that influence without being obvious. Your prospects will feel compelled to respond without knowing why.",
    icon: "✨",
    result: "+278% reply rates",
    feature: "NLP + Hypnotic Language"
  },
  {
    title: "Behavioral Prediction Engine",
    description: "Analyzes thousands of behavioral data points to predict buying likelihood with 94% accuracy. Know who's ready to buy, who needs nurturing, and who's wasting your time.",
    icon: "📊",
    result: "+67% sales velocity",
    feature: "Predictive Psychology AI"
  }
];

export default function AICapabilitiesGrid() {
  return (
    <div className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Your Psychological Sales Arsenal
            </h2>
            <p className="text-2xl text-blue-600 font-bold mb-4">
              6 AI-Powered Tools That Read Minds & Close Deals
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.15)' }}
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                    {capability.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-600">{capability.result}</div>
                    <div className="text-xs text-gray-500 font-medium">avg. improvement</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {capability.title}
                </h3>
                
                <p className="text-gray-600 flex-grow mb-4 leading-relaxed">
                  {capability.description}
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-lg border border-blue-100">
                  <div className="text-sm font-bold text-blue-700">{capability.feature}</div>
                </div>
              </div>
              
              {/* Hover overlay effect */}
              <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-8 rounded-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              🔥 Ready to Turn Psychology Into Profit?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Every feature above is included FREE during our beta period. Start reading minds and closing deals today.
            </p>
            <motion.button
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-12 py-4 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              UNLOCK YOUR PSYCHOLOGY ADVANTAGE
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}