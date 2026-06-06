module.exports = (sequelize, DataTypes) => {
  const LearnSubject = sequelize.define("LearnSubject", {
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  LearnSubject.associate = (models) => {
    LearnSubject.belongsTo(models.User, { foreignKey: "userId" });
  };

  return LearnSubject;
};
