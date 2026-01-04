
/*//////////////////////////////////////////////////////////////

OFFICIAL WEBSITE LINKS OF  YAMADOGS NFT
https://yamadogs.org
https://yamadogs.github.io

/////////////////////////////////////////////////////////////////*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";


interface IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4);
}

contract YAMADOGS is IERC721, IERC721Metadata, IERC721Enumerable {
    using Strings for uint256;
    
    string internal constant DESCRIPTION =
        "YAMADOGS is a collection of 2,026 fully on-chain generative NFT collectibles, where 100% of the metadata and images live directly on the blockchain. No IPFS No external servers  No private hosting  Pure on-chain permanence Once deployed, YAMADOGS exists as long as the blockchain exists. ";

    
    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => uint256) private _seeds;

    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;
    
    address public immutable owner;
    constructor() {
    owner = msg.sender;
   }

    /*//////////////////////////////////////////////////////////////
                                MINT
    //////////////////////////////////////////////////////////////*/
    uint256 public constant MAX_SUPPLY = 2026;
    uint256 public constant MINT_PRICE = 0.0005 ether;

    address public constant TREASURY =
        0x7c4e9A3bB509A33d6bD5E8C0aA002Fef5171B719;

    function mint() external payable {
    uint256 id = _allTokens.length + 1;
    require(id <= MAX_SUPPLY, "MAX_SUPPLY");
    require(msg.value == MINT_PRICE, "WRONG_PRICE");

    _seeds[id] = uint256(
        keccak256(
            abi.encodePacked(
                "YAMADOG_SEED",
                id,
                msg.sender,
                block.timestamp,
                block.prevrandao
            )
        )
    );

    
    _mint(msg.sender, id);
    (bool success,) = TREASURY.call{value: msg.value}("");
    require(success, "TRANSFER_FAIL");
}


    function _mint(address to, uint256 id) internal {
    require(to != address(0), "ZERO_ADDRESS");

    _ownerOf[id] = to;
    _balanceOf[to]++;
    _allTokensIndex[id] = _allTokens.length;
    _allTokens.push(id);
    _ownedTokensIndex[id] = _ownedTokens[to].length;
    _ownedTokens[to].push(id);
    emit Transfer(address(0), to, id);
}


    /*//////////////////////////////////////////////////////////////
                        ERC721 CORE
    //////////////////////////////////////////////////////////////*/
    function ownerOf(uint256 id) public view override returns (address o) {
        require((o = _ownerOf[id]) != address(0), "NONEXISTENT");
    }

    function balanceOf(address o) external view override returns (uint256) {
        require(o != address(0), "ZERO_ADDRESS");
        return _balanceOf[o];
    }

    function approve(address s, uint256 id) external override {
        address o = ownerOf(id);
        require(msg.sender == o || isApprovedForAll(o, msg.sender), "NOT_AUTH");
        _tokenApprovals[id] = s;
        emit Approval(o, s, id);
    }

    function getApproved(uint256 id) public view override returns (address) {
        return _tokenApprovals[id];
    }

    function setApprovalForAll(address op, bool a) external override {
        _operatorApprovals[msg.sender][op] = a;
        emit ApprovalForAll(msg.sender, op, a);
    }

    function isApprovedForAll(address o, address op) public view override returns (bool) {
        return _operatorApprovals[o][op];
    }

    function transferFrom(address f, address t, uint256 id) public override {
        address o = ownerOf(id);
        require(o == f, "NOT_OWNER");
        require(t != address(0), "ZERO_ADDRESS");
        require(
            msg.sender == o ||
            msg.sender == getApproved(id) ||
            isApprovedForAll(o, msg.sender),
            "NOT_AUTH"
        );

        _balanceOf[f]--;
        _balanceOf[t]++;
        _ownerOf[id] = t;

        _removeTokenFromOwnerEnumeration(f, id);
        _addTokenToOwnerEnumeration(t, id);

        delete _tokenApprovals[id];
        emit Transfer(f, t, id);
    }

    function safeTransferFrom(address f, address t, uint256 id, bytes memory d) public override {
        transferFrom(f, t, id);
        if (t.code.length != 0) {
            require(
                IERC721Receiver(t).onERC721Received(msg.sender, f, id, d)
                    == IERC721Receiver.onERC721Received.selector,
                "UNSAFE_RECIPIENT"
            );
        }
    }

    function safeTransferFrom(address f, address t, uint256 id) external override {
        safeTransferFrom(f, t, id, "");
    }

    function _removeTokenFromOwnerEnumeration(address f, uint256 id) internal {
        uint256 last = _ownedTokens[f].length - 1;
        uint256 i = _ownedTokensIndex[id];
        if (i != last) {
            uint256 lid = _ownedTokens[f][last];
            _ownedTokens[f][i] = lid;
            _ownedTokensIndex[lid] = i;
        }
        _ownedTokens[f].pop();
       delete _ownedTokensIndex[id];

    }

    function _addTokenToOwnerEnumeration(address t, uint256 id) internal {
        _ownedTokensIndex[id] = _ownedTokens[t].length;
        _ownedTokens[t].push(id);
    }
    
/*//////////////////////////////////////////////////////////////
                    ERC721 ENUMERABLE (PUBLIC)
//////////////////////////////////////////////////////////////*/

function totalSupply() external view override returns (uint256) {
    return _allTokens.length;
}

function tokenByIndex(uint256 index) external view override returns (uint256) {
    require(index < _allTokens.length, "INDEX_OUT_OF_BOUNDS");
    return _allTokens[index];
}

function tokenOfOwnerByIndex(address ownerAddress, uint256 index)
    external
    view
    override
    returns (uint256)
{
    require(index < _ownedTokens[ownerAddress].length, "INDEX_OUT_OF_BOUNDS");
    return _ownedTokens[ownerAddress][index];
}



    /*//////////////////////////////////////////////////////////////
                        RANDOM
    //////////////////////////////////////////////////////////////*/
function name() external pure override returns (string memory) {
    return "YAMADOGS";
}

function symbol() external pure override returns (string memory) {
    return "YADO";
}


    function _pick(uint256 s, string memory salt, uint256 mod)
        internal pure
        returns (uint256)
    {
        return uint256(keccak256(abi.encodePacked(s, salt))) % mod;
    }

    function _randomColor(uint256 s, string memory salt) internal pure returns (string memory) {
        uint256 n = uint256(keccak256(abi.encodePacked(s, salt))) % 0xFFFFFF;
        return string(abi.encodePacked("#", _toHexColor(n)));
    }

    function _toHexColor(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(6);
        for (uint256 i = 0; i < 6; i++) {
            uint256 v = (value >> (20 - i * 4)) & 0xF;
            buffer[i] = v < 10 ? bytes1(uint8(v + 48)) : bytes1(uint8(v + 87));
        }
        return string(buffer);
    }

    /*//////////////////////////////////////////////////////////////
                                TRAITS
    //////////////////////////////////////////////////////////////*/
    struct Traits {
        uint8 ears;
        uint8 inner;
        uint8 eyes;
        uint8 pupils;
        uint8 nose;
        uint8 mouth;
        uint8 hair;
        uint8 feet;
        uint8 fur;
        uint8 eyePatch;
        uint8 mask;
    }

    function _traits(uint256 s) internal pure returns (Traits memory t) {
        t.ears     = uint8(_pick(s,"EARS",9));
        t.inner    = uint8(_pick(s,"INNER",9));
        t.eyes     = uint8(_pick(s,"EYES",9));
        t.pupils   = uint8(_pick(s,"PUPILS",9));
        t.nose     = uint8(_pick(s,"NOSE",7));
        t.mouth    = uint8(_pick(s,"MOUTH",9));
        t.hair     = uint8(_pick(s,"HAIR",9));
        t.feet     = uint8(_pick(s,"FEET",6));
        t.fur      = uint8(_pick(s,"FURC",100) < 60 ? 1 : 0);
        t.eyePatch = uint8(_pick(s,"PATCH",100) < 60 ? 1 : 0);
        t.mask     = uint8(_pick(s,"MASK",100) < 60 ? 1 : 0);
    }

    /*//////////////////////////////////////////////////////////////
                                COLORS
    //////////////////////////////////////////////////////////////*/
    struct ColorSet {
        string body;
        string ear1;
        string ear2;
        string inner1;
        string inner2;
        string head;
        string hair;
        string eye1;
        string eye2;
        string pupil1;
        string pupil2;
        string snout;
        string nose;
        string mouth;
        string fur;
        string mask;
        string foot1;
        string foot2;
    }

    /*//////////////////////////////////////////////////////////////
                                SVG SHAPES
    //////////////////////////////////////////////////////////////*/
    function circle(uint x, uint y, uint r, string memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<circle cx="', x.toString(),
            '" cy="', y.toString(),
            '" r="', r.toString(),
            '" fill="', c, '"/>'
        ));
    }

    function square(uint x, uint y, uint s, string memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="', (x - s).toString(),
            '" y="', (y - s).toString(),
            '" width="', (s * 2).toString(),
            '" height="', (s * 2).toString(),
            '" fill="', c, '"/>'
        ));
    }

    function horizontalLine(uint x, uint y, uint w, uint h, string memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="', (x - w / 2).toString(),
            '" y="', (y - h / 2).toString(),
            '" width="', w.toString(),
            '" height="', h.toString(),
            '" fill="', c, '" />'
        ));
    }

    function newRectangle(uint x, uint y, uint w, uint h, string memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="', (x - w / 2).toString(),
            '" y="', (y - h / 2).toString(),
            '" width="', w.toString(),
            '" height="', h.toString(),
            '" fill="', c, '" />'
        ));
    }

    function shape(uint t, uint cx, uint cy, uint w, uint h, string memory c) internal pure returns (string memory) {
        if (t == 0) return circle(cx, cy, w, c);
        if (t == 1) return square(cx, cy, w, c);
        if (t == 2) return string(abi.encodePacked('<ellipse cx="', cx.toString(), '" cy="', cy.toString(), '" rx="', w.toString(), '" ry="', (w / 2).toString(), '" fill="', c, '" />'));
        if (t == 3) return string(abi.encodePacked('<polygon points="', cx.toString(), ',', (cy - w).toString(), ' ', (cx - w).toString(), ',', (cy + w).toString(), ' ', (cx + w).toString(), ',', (cy + w).toString(), '" fill="', c, '" />'));
        if (t == 4) return string(abi.encodePacked('<rect x="', (cx - w).toString(), '" y="', (cy - w / 2).toString(), '" width="', (w * 2).toString(), '" height="', w.toString(), '" rx="', w.toString(), '" fill="', c, '" />'));
        if (t == 5) return string(abi.encodePacked('<path d="M ', (cx-w).toString(),' ',cy.toString(),' A ',w.toString(),' ',w.toString(),' 0 0 1 ',(cx+w).toString(),' ',cy.toString(),' L ',cx.toString(),' ',cy.toString(),' Z" fill="',c,'"/>'));
        if (t == 6) return string(abi.encodePacked('<path d="M ', (cx-w).toString(),' ',cy.toString(),' A ',w.toString(),' ',w.toString(),' 0 0 0 ',(cx+w).toString(),' ',cy.toString(),' L ',cx.toString(),' ',cy.toString(),' Z" fill="',c,'"/>'));
        if (t == 7) return horizontalLine(cx, cy, w, h, c);
        if (t == 8) return newRectangle(cx, cy, w, h, c);
        return circle(cx, cy, w, c);
    }

    function mouthShape(uint t, uint cx, uint cy, uint w, uint h, string memory c) internal pure returns (string memory) {
        if (t == 1 || t == 3) return shape(t, cx, cy, w / 2, h, c);
        return shape(t, cx, cy, w, h, c);
    }

    /*//////////////////////////////////////////////////////////////
                                SVG PARTS
    //////////////////////////////////////////////////////////////*/
    function _svgBody(Traits memory t, ColorSet memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="90" y="180" width="120" height="90" rx="35" fill="',c.body,'"/>',
            shape(t.ears,95,75,28,40,c.ear1),
            shape(t.ears,205,75,28,40,c.ear2),
            shape(t.inner,95,80,12,20,c.inner1),
            shape(t.inner,205,80,12,20,c.inner2)
        ));
    }

    function _svgFur(Traits memory t, ColorSet memory c) internal pure returns (string memory) {
        if (t.fur == 0) return "";
        return string(abi.encodePacked('<rect x="108" y="194" width="84" height="63" rx="25" fill="',c.fur,'"/>'));
    }

    function _svgHead(Traits memory t, ColorSet memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            circle(150,130,70,c.head),
            shape(t.hair,150,55,22,15,c.hair),
            shape(t.eyes,120,130,18,18,c.eye1),
            shape(t.eyes,180,130,18,18,c.eye2),
            shape(t.pupils,120,130,8,8,c.pupil1),
            shape(t.pupils,180,130,8,8,c.pupil2),
            circle(150,170,32,c.snout),
            shape(t.nose,150,155,7,7,c.nose),
            mouthShape(t.mouth,150,180,18,8,c.mouth)
        ));
    }

    function _svgEyePatch(Traits memory t) internal pure returns (string memory) {
        if (t.eyePatch == 0) return "";
        return '<rect x="96" y="106" width="48" height="48" rx="10" ry="10" fill="#000"/>';
    }

    function _svgMask(Traits memory t, ColorSet memory c) internal pure returns (string memory) {
    if (t.mask == 0) return "";

    uint cx = 150;     
    uint cy = 130;      
    uint w  = 70;      

    return string(abi.encodePacked(
        '<path d="M ',
        cx.toString(), ' ', (cy - w).toString(),
        ' A ', w.toString(), ' ', w.toString(),
        ' 0 0 1 ',
        cx.toString(), ' ', (cy + w).toString(),
        ' L ', cx.toString(), ' ', cy.toString(),
        ' Z" fill="', c.mask, '"/>',

        '<path d="M 152 105 L 144 142" stroke="#550000" stroke-width="3"/>',
        '<path d="M 162 108 L 154 147" stroke="#550000" stroke-width="3"/>',
        '<path d="M 172 112 L 164 150" stroke="#550000" stroke-width="3"/>'
    ));
}

    function _svgFeet(Traits memory t, ColorSet memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(
            shape(t.feet,105,258,10,10,c.foot1),
            shape(t.feet,195,258,10,10,c.foot2)
        ));
    }
    
function _boolTrait(string memory traitName, uint8 v)
    internal
    pure
    returns (string memory)
{
    return string(
        abi.encodePacked(
            '{"trait_type":"', traitName, '","value":"',
            v == 1 ? "Yes" : "No",
            '"}'
        )
    );
}

function _numTrait(string memory traitName, uint8 v)
    internal
    pure
    returns (string memory)
{
    return string(
        abi.encodePacked(
            '{"trait_type":"', traitName, '","value":"',
            uint256(v).toString(),
            '"}'
        )
    );
}


function _attributes(Traits memory t)
    internal
    pure
    returns (string memory)
{
    return string(
        abi.encodePacked(
            '[',
            _numTrait("Ears", t.ears), ',',
            _numTrait("Inner Ears", t.inner), ',',
            _numTrait("Eyes", t.eyes), ',',
            _numTrait("Pupils", t.pupils), ',',
            _numTrait("Nose", t.nose), ',',
            _numTrait("Mouth", t.mouth), ',',
            _numTrait("Hair", t.hair), ',',
            _numTrait("Feet", t.feet), ',',
            _boolTrait("Fur", t.fur), ',',
            _boolTrait("Eye Patch", t.eyePatch), ',',
            _boolTrait("Mask", t.mask),
            ']'
        )
    );
}


    /*//////////////////////////////////////////////////////////////
                                TOKEN URI
    //////////////////////////////////////////////////////////////*/
    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_ownerOf[id] != address(0), "NONEXISTENT"); // existence check

        uint256 s = _seeds[id];
        Traits memory t = _traits(s);

        ColorSet memory c = ColorSet(
            _randomColor(s,"BODY"),
            _randomColor(s,"EAR1"),
            _randomColor(s,"EAR2"),
            _randomColor(s,"INNER1"),
            _randomColor(s,"INNER2"),
            _randomColor(s,"HEAD"),
            _randomColor(s,"HAIR"),
            _randomColor(s,"EYE1"),
            _randomColor(s,"EYE2"),
            _randomColor(s,"PUPIL1"),
            _randomColor(s,"PUPIL2"),
            _randomColor(s,"SNOUT"),
            _randomColor(s,"NOSE"),
            _randomColor(s,"MOUTH"),
            _randomColor(s,"FUR"),
            _randomColor(s,"MASK"),
            _randomColor(s,"FOOT1"),
            _randomColor(s,"FOOT2")
        );

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">',
            '<rect width="300" height="300" fill="', _randomColor(s,"BACKGROUND"), '"/>',
            _svgBody(t,c),
            _svgFur(t,c),
            _svgHead(t,c),
            _svgEyePatch(t),
            _svgMask(t,c),
            _svgFeet(t,c),
            '</svg>'
        ));

        string memory json = Base64.encode(
    bytes(
        string(
            abi.encodePacked(
                '{"name":"YADO #', id.toString(),
                '","description":"', DESCRIPTION,
                '","attributes":', _attributes(t),
                ',"image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )
        )
    )
);


        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        revert("NO_RECEIVE");
    }

    
    function supportsInterface(bytes4 interfaceId)
    public
    pure
    override
    returns (bool)
{
    return
        interfaceId == type(IERC165).interfaceId ||
        interfaceId == type(IERC721).interfaceId ||
        interfaceId == type(IERC721Metadata).interfaceId ||
        interfaceId == type(IERC721Enumerable).interfaceId;
}


}
