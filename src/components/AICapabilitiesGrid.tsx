import { motion } from 'framer-motion';

const capabilities = [
  {
    title: "Psychological Profiling",
    description: "Analyzes communication patterns to build detailed psychological profiles of your contacts, helping you understand their decision-making style, personality traits, and communication preferences.",
    icon: "🧠"
  },
  {
    title: "AI-Powered Insights",
    description: "Leverages advanced AI to analyze conversations and provide real-time suggestions on how to improve your messaging for better engagement and conversion rates.",
    icon: "💡"
  },
  {
    title: "Persuasion Engine",
    description: "Uses proven psychological principles to craft messages that resonate with your audience, increasing the likelihood of positive responses and successful outcomes.",
    icon: "✨"
  },
  {
    title: "Relationship Intelligence",
    description: "Tracks and analyzes all your interactions to provide insights into relationship strength and suggest optimal follow-up strategies.",
    icon: "🤝"
  },
  {
    title: "Emotional Triggers",
    description: "Identifies and leverages emotional triggers in your communications to create more impactful and memorable messages that drive action.",
    icon: "🎯"
  },
  {
    title: "Performance Analytics",
    description: "Provides detailed analytics on your communication effectiveness, helping you continuously improve your approach based on data-driven insights.",
    icon: "📊"
  }
];

export default function AICapabilitiesGrid() {
  return (
    <div className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Next-Level Sales Intelligence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harness the power of psychology and AI to transform your sales process
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            >
              <div className="text-4xl mb-4">{capability.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {capability.title}
              </h3>
              <p className="text-gray-600 flex-grow">
                {capability.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
