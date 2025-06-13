import { Card, CardContent } from "@/components/ui/card";

export default function Rules() {
  const rules = [
    {
      category: "General Rules",
      color: "neon-green",
      icon: "fas fa-shield-alt",
      items: [
        "No attacking other teams or the CTF infrastructure",
        "No sharing flags or solutions with other participants", 
        "Flag format: CyberCTF{...}",
        "Maximum 4 team members per team",
        "Respect other participants and maintain good sportsmanship",
        "Any violation may result in disqualification"
      ]
    },
    {
      category: "Flag Submission",
      color: "neon-pink",
      icon: "fas fa-flag",
      items: [
        "Submit flags through the web interface only",
        "Wrong submissions trigger progressive rate limiting",
        "Progressive delays: 5s → 10s → 15s for consecutive wrong attempts",
        "Flags are case-sensitive and must be exact matches",
        "No automated flag submission tools allowed",
        "Each user can only submit one correct flag per challenge"
      ]
    },
    {
      category: "Scoring System", 
      color: "electric-yellow",
      icon: "fas fa-star",
      items: [
        "Points are awarded based on challenge difficulty",
        "First blood bonus: +50 points for first solve",
        "Hint usage penalty: -10 points per hint used",
        "Leaderboard updates in real-time",
        "Final rankings determined by total points and solve time",
        "Ties are broken by earliest submission time"
      ]
    },
    {
      category: "Challenge Categories",
      color: "neon-cyan", 
      icon: "fas fa-puzzle-piece",
      items: [
        "Web: Web application security vulnerabilities",
        "Crypto: Cryptography and encryption challenges",
        "Pwn: Binary exploitation and reverse engineering",
        "Forensics: Digital forensics and investigation",
        "Misc: Logic puzzles and unique challenges",
        "Each category tests different cybersecurity skills"
      ]
    },
    {
      category: "Technical Rules",
      color: "neon-green",
      icon: "fas fa-cog",
      items: [
        "Use of automated tools is permitted unless stated otherwise",
        "Brute force attacks against challenge infrastructure are forbidden",
        "Do not attempt to access other users' data or accounts",
        "Report any technical issues to administrators immediately",
        "Challenge instances may be reset periodically",
        "All traffic is logged for security purposes"
      ]
    },
    {
      category: "Code of Conduct",
      color: "neon-pink",
      icon: "fas fa-handshake",
      items: [
        "Maintain respectful communication in all interactions",
        "No harassment, discrimination, or toxic behavior",
        "Help create an inclusive learning environment",
        "Share knowledge responsibly after competition ends",
        "Follow responsible disclosure for any vulnerabilities found",
        "Have fun and learn something new!"
      ]
    }
  ];

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            <span className="neon-green">Competition</span> <span className="neon-cyan">Rules</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Please read and understand all rules before participating in CyberCTF challenges
          </p>
        </div>

        {/* Rules Sections */}
        <div className="space-y-6">
          {rules.map((section, index) => (
            <Card 
              key={section.category}
              className="glass hover:shadow-neon transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 font-mono">
                <div className={`${section.color} mb-4 flex items-center text-xl font-bold`}>
                  <i className={`${section.icon} mr-3`}></i>
                  <span># {section.category}</span>
                </div>
                <div className="pl-8 space-y-3 text-gray-300">
                  {section.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="flex items-start group hover:neon-cyan transition-colors duration-300"
                    >
                      <span className="neon-cyan mr-3 mt-1 group-hover:neon-green transition-colors duration-300">
                        ➤
                      </span>
                      <span className="flex-1 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notice */}
        <Card className="glass border-red-500 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="text-red-500 text-2xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg text-red-400 mb-2">Important Notice</h3>
                <p className="text-gray-300 leading-relaxed">
                  By participating in CyberCTF, you agree to abide by all rules and regulations. 
                  Violation of any rules may result in immediate disqualification and potential 
                  ban from future competitions. All decisions made by the administration team are final.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="glass mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-orbitron text-xl font-bold neon-cyan mb-4">
              Need Help or Have Questions?
            </h3>
            <p className="text-gray-400 mb-4">
              Contact the administration team if you have any questions about the rules or need clarification.
            </p>
            <div className="flex justify-center space-x-6">
              <a 
                href="#" 
                className="flex items-center space-x-2 text-neon-green hover:neon-cyan transition-colors duration-300"
              >
                <i className="fab fa-discord"></i>
                <span>Discord Support</span>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-2 text-neon-green hover:neon-cyan transition-colors duration-300"
              >
                <i className="fas fa-envelope"></i>
                <span>Email Support</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
