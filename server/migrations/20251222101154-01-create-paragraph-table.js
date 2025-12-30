'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('paragraphs', {
            paragraph_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        const now = new Date();

        const stanzas = [
            { content: "The early morning sun slowly rises above the quiet city skyline Fresh air fills the streets with calm energy and new possibilities Every new day offers a chance to improve skills and mindset", createdAt: now, updatedAt: now },
            { content: "Consistent practice builds habits that last longer than motivation Small improvements repeated daily create long term progress Patience and focus are essential for mastery", createdAt: now, updatedAt: now },
            { content: "Typing efficiently requires relaxed hands steady breathing and full concentration Accuracy should be prioritized before speed Speed develops naturally with time", createdAt: now, updatedAt: now },

            { content: "Technology has transformed communication learning and everyday productivity Information now travels instantly across countries and cultures Responsible use of technology benefits society", createdAt: now, updatedAt: now },

            { content: "Learning from mistakes creates strong understanding and confidence Failure provides feedback for better decisions Growth happens through persistence", createdAt: now, updatedAt: now },

            { content: "Discipline creates structure when motivation fades Strong routines improve efficiency and reduce stress Success often comes from consistent effort", createdAt: now, updatedAt: now },

            { content: "Writing clean code requires logical thinking clarity and patience Simple solutions are easier to maintain and debug Readable code saves time", createdAt: now, updatedAt: now },

            { content: "Time management plays a crucial role in achieving meaningful goals Prioritizing tasks reduces stress and increases productivity Focused effort compounds", createdAt: now, updatedAt: now },

            { content: "Deep focus enables complex problem solving without distractions Clear thinking improves execution and builds confidence Quality work requires attention", createdAt: now, updatedAt: now },

            { content: "Regular typing practice strengthens muscle memory and coordination Familiarity with the keyboard reduces hesitation and errors Typing becomes effortless", createdAt: now, updatedAt: now },

            { content: "Errors are a natural part of learning any new skill Correcting mistakes builds awareness Fear of failure limits progress", createdAt: now, updatedAt: now },

            { content: "Modern technology evolves rapidly demanding continuous learning Adaptability keeps skills relevant Curiosity drives lifelong growth", createdAt: now, updatedAt: now },

            { content: "Simple solutions often outperform complex designs Overengineering increases confusion and maintenance cost Clarity improves collaboration", createdAt: now, updatedAt: now },

            { content: "Hard work compounds quietly without immediate rewards Persistent effort leads to breakthroughs Consistency beats intensity", createdAt: now, updatedAt: now },

            { content: "Confidence develops through repeated practice and experience Skill mastery requires feedback and reflection Preparation builds trust", createdAt: now, updatedAt: now },

            { content: "Reading expands vocabulary comprehension and thinking speed Writing improves clarity and expression Typing connects both skills", createdAt: now, updatedAt: now },

            { content: "Every typing race begins with equal opportunity Focus calmness and discipline determine results Controlled speed improves accuracy", createdAt: now, updatedAt: now },

            { content: "Challenges push individuals beyond comfort zones Pressure reveals strengths and weaknesses Growth requires resilience", createdAt: now, updatedAt: now },

            { content: "Good posture improves endurance during long typing sessions Relaxed wrists prevent fatigue Comfort improves performance", createdAt: now, updatedAt: now },

            { content: "Success is built through daily intentional actions Small efforts create momentum Never stop learning and improving", createdAt: now, updatedAt: now }
        ];

        return queryInterface.bulkInsert('paragraphs', stanzas);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('paragraphs');
    }
};
