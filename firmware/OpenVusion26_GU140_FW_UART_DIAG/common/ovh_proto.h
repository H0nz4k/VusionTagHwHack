#ifndef OVH_PROTO_H
#define OVH_PROTO_H

#define OVH_MAGIC0        'O'
#define OVH_MAGIC1        'V'
#define OVH_MAGIC2        'H'
#define OVH_PROTO_VER     1
#define OVH_HDR_SIZE      16
#define OVH_MAX_PAYLOAD   24

#define OVH_TYPE_PING         0x01
#define OVH_TYPE_PONG         0x02
#define OVH_TYPE_STATUS_REQ   0x03
#define OVH_TYPE_STATUS       0x04
#define OVH_TYPE_ACK          0x05
#define OVH_TYPE_NACK         0x06
#define OVH_TYPE_SHOW_DEMO    0x10

#define OVH_FLAG_NEED_ACK     0x01
#define OVH_FLAG_DUP_REPLY    0x02
#define OVH_FLAG_SEC          0x80

#endif
