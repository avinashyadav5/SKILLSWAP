module.exports = (sequelize, DataTypes) => {
  const TeachSubject = sequelize.define("TeachSubject", {
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  TeachSubject.associate = (models) => {
    TeachSubject.belongsTo(models.User, { foreignKey: "userId" });
  };

  return TeachSubject;
};
