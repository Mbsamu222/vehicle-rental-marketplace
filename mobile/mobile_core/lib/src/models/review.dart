import 'user.dart';
import '../utils/json_helpers.dart';

class ReviewImage {
  final String id;
  final String reviewId;
  final String url;

  ReviewImage({required this.id, required this.reviewId, required this.url});

  factory ReviewImage.fromJson(Map<String, dynamic> json) => ReviewImage(
        id: asString(json["id"]),
        reviewId: asString(json["reviewId"]),
        url: asString(json["url"]),
      );
}

class ReviewReply {
  final String id;
  final String reviewId;
  final String authorId;
  final String message;
  final DateTime createdAt;

  ReviewReply({
    required this.id,
    required this.reviewId,
    required this.authorId,
    required this.message,
    required this.createdAt,
  });

  factory ReviewReply.fromJson(Map<String, dynamic> json) => ReviewReply(
        id: asString(json["id"]),
        reviewId: asString(json["reviewId"]),
        authorId: asString(json["authorId"]),
        message: asString(json["message"]),
        createdAt: asDate(json["createdAt"]),
      );
}

class Review {
  final String id;
  final String bookingId;
  final String customerId;
  final String vehicleId;
  final String rentalPartnerId;
  final int vehicleRating;
  final int partnerRating;
  final String? comment;
  final bool isReported;
  final DateTime createdAt;
  final AppUser? customer;
  final List<ReviewImage> images;
  final List<ReviewReply> replies;

  Review({
    required this.id,
    required this.bookingId,
    required this.customerId,
    required this.vehicleId,
    required this.rentalPartnerId,
    required this.vehicleRating,
    required this.partnerRating,
    this.comment,
    required this.isReported,
    required this.createdAt,
    this.customer,
    this.images = const [],
    this.replies = const [],
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: asString(json["id"]),
        bookingId: asString(json["bookingId"]),
        customerId: asString(json["customerId"]),
        vehicleId: asString(json["vehicleId"]),
        rentalPartnerId: asString(json["rentalPartnerId"]),
        vehicleRating: asInt(json["vehicleRating"]),
        partnerRating: asInt(json["partnerRating"]),
        comment: asStringOrNull(json["comment"]),
        isReported: asBool(json["isReported"]),
        createdAt: asDate(json["createdAt"]),
        customer: asMapOrNull(json["customer"]) != null ? AppUser.fromJson(asMapOrNull(json["customer"])!) : null,
        images: asMapList(json["images"]).map(ReviewImage.fromJson).toList(),
        replies: asMapList(json["replies"]).map(ReviewReply.fromJson).toList(),
      );
}
