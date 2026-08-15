import PropTypes from "prop-types";
import Avatar from "../common/Avatar";

function MemberCard({ member }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition border border-gray-100">
      <Avatar
        src={member.avatar || member.img}
        alt={member.name}
        size="custom"
        className="w-14 h-14 ring-2 ring-gray-100"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{member.name}</h3>
        <p className="text-sm text-gray-600 truncate">{member.skill}</p>
      </div>
    </div>
  );
}

MemberCard.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    img: PropTypes.string,
    skill: PropTypes.string
  }).isRequired
};

export default MemberCard;
